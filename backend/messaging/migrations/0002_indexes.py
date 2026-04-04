from django.core.validators import MaxLengthValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='content',
            field=models.TextField(validators=[MaxLengthValidator(4000)]),
        ),
        migrations.AlterField(
            model_name='message',
            name='is_read',
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AlterField(
            model_name='message',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['recipient', 'is_read'], name='msg_recipient_read_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['sender', 'recipient'], name='msg_sender_recipient_idx'),
        ),
    ]
