from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_contactmessage'),
    ]

    operations = [
        # Scholarships
        migrations.AlterField(
            model_name='scholarships',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='scholarships',
            name='level',
            field=models.CharField(blank=True, max_length=100, null=True, db_index=True),
        ),
        # ContactMessage
        migrations.AlterField(
            model_name='contactmessage',
            name='is_read',
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AlterField(
            model_name='contactmessage',
            name='message',
            field=models.TextField(max_length=5000),
        ),
    ]
