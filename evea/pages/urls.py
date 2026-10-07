from django.urls import path

from pages.views import dynamic_pages_view
from pages.views import root_page_view
from pages.views import sample_request_view

app_name = "pages"

urlpatterns = [
    path("", root_page_view, name="index"),
    path("sample/", sample_request_view, name="sample"),
    path("<str:template_name>/", dynamic_pages_view, name="dynamic_pages"),
]
