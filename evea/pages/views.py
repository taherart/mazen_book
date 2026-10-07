from django import forms
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.template import TemplateDoesNotExist
from django.views.decorators.http import require_POST

from . import book_data
from .models import SampleRequest


class SampleForm(forms.ModelForm):
    class Meta:
        model = SampleRequest
        fields = ["name", "email"]


def root_page_view(request):
    methods = book_data.build_methods()
    context = {
        "methods": methods,
        "domains": book_data.build_domains(methods),
        "capital_labels": book_data.CAPITAL_LABELS,
        "time_labels": book_data.TIME_LABELS,
        "page_parts": book_data.PAGE_PARTS,
        "features": book_data.FEATURES,
        "audience": book_data.AUDIENCE,
        "author": book_data.AUTHOR,
        "faq": book_data.FAQ,
        "partners": book_data.PARTNERS,
        "testimonials": book_data.TESTIMONIALS,
        "zero_capital_count": sum(1 for m in methods if m["cap_bucket"] == "zero"),
        "order_url": getattr(settings, "BOOK_ORDER_URL", "#order"),
        "sample_action": getattr(settings, "BOOK_SAMPLE_FORM_ACTION", "") or "/sample/",
    }
    return render(request, "pages/book.html", context)


@require_POST
def sample_request_view(request):
    form = SampleForm(request.POST)
    if form.is_valid():
        form.save()
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False, "errors": form.errors.get_json_data()}, status=400)


def dynamic_pages_view(request, template_name):
    try:
        return render(request, f"pages/{template_name}.html")
    except TemplateDoesNotExist:
        return render(request, "404.html")
