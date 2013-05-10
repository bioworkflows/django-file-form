import json
import uuid

from django.core.urlresolvers import reverse
from django.forms import FileField, ClearableFileInput, CharField, HiddenInput
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe
from django.core import validators

from .models import UploadedFile


class FileFormMixin(object):
    def __init__(self, *args, **kwargs):
        super(FileFormMixin, self).__init__(*args, **kwargs)

        self.add_hidden_field('form_id', uuid.uuid4)
        self.add_hidden_field('upload_url', reverse('file_form_handle_upload'))
        self.add_hidden_field('delete_url', reverse('file_form_handle_delete_no_args'))

    def add_hidden_field(self, name, initial):
        self.fields[name] = CharField(widget=HiddenInput, initial=initial)

    def full_clean(self):
        if not self.is_bound:
            # Form is unbound; just call super
            super(FileFormMixin, self).full_clean()
        else:
            # Update file data of the form
            self.update_files_data()

            # Call super
            super(FileFormMixin, self).full_clean()

    def update_files_data(self):
        form_id = self.data['form_id']

        for field_name, field in self.fields.iteritems():
            if hasattr(field, 'get_file_data'):
                file_data = field.get_file_data(field_name, form_id)

                if file_data:
                    self.files[field_name] = file_data

    def delete_temporary_files(self):
        form_id = self.data['form_id']

        for field_name, field in self.fields.iteritems():
            if hasattr(field, 'delete_file_data'):
                field.delete_file_data(field_name, form_id)


class UploadWidget(ClearableFileInput):
    def render(self, name, value, attrs=None):
        files_data = None

        if value:
            if isinstance(value, list):
                values = value
            else:
                values = [value]

            if hasattr(values[0], 'file_id'):
                files_data = json.dumps(
                    [
                        dict(id=value.file_id, name=value.name) for value in values
                    ]
                )

        return mark_safe(
            render_to_string(
                'django_file_form/upload_widget.html',
                dict(
                    input=super(UploadWidget, self).render(name, value, attrs),
                    files_data=files_data
                )
            )
        )


class UploadedFileField(FileField):
    widget = UploadWidget

    def get_file_qs(self, field_name, form_id):
        return UploadedFile.objects.filter(
            form_id=form_id,
            field_name=field_name
        )

    def get_file_data(self, field_name, form_id):
        qs = self.get_file_qs(field_name, form_id)

        if qs.exists():
            return qs.latest('created').get_uploaded_file()
        else:
            return None

    def delete_file_data(self, field_name, form_id):
        qs = self.get_file_qs(field_name, form_id)

        for f in qs:
            f.delete()


class MultipleUploadedFileField(UploadedFileField):
    def widget_attrs(self, widget):
        attrs = super(MultipleUploadedFileField, self).widget_attrs(widget)

        attrs['multiple'] = 'multiple'
        return attrs

    def get_file_data(self, field_name, form_id):
        qs = self.get_file_qs(field_name, form_id)

        return [
            f.get_uploaded_file() for f in qs
        ]

    def to_python(self, data):
        if data in validators.EMPTY_VALUES:
            return None
        elif isinstance(data, list):
            for f in data:
                super(MultipleUploadedFileField, self).to_python(f)

            return data
        else:
            return [data]