from django.contrib import admin

from .models import SampleRequest


@admin.register(SampleRequest)
class SampleRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created")
    search_fields = ("name", "email")
    date_hierarchy = "created"
