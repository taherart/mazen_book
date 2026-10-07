from django.db import models


class SampleRequest(models.Model):
    """Lead captured by the «free sample» form."""

    name = models.CharField("الاسم", max_length=120)
    email = models.EmailField("البريد الإلكتروني")
    created = models.DateTimeField("التاريخ", auto_now_add=True)

    class Meta:
        ordering = ["-created"]
        verbose_name = "طلب عينة"
        verbose_name_plural = "طلبات العينة"

    def __str__(self):
        return f"{self.name} <{self.email}>"
