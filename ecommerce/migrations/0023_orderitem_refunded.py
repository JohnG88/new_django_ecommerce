# Generated by Django 4.1 on 2023-02-17 20:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0022_order_stripe_charge_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='refunded',
            field=models.BooleanField(default=False),
        ),
    ]
