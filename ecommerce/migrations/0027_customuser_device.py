# Generated by Django 4.1 on 2023-05-25 17:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0026_item_stock_limit'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='device',
            field=models.CharField(blank=True, max_length=300, null=True),
        ),
    ]
