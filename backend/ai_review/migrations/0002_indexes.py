from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_review', '0001_initial'),
    ]

    operations = [
        # AIReviewSession
        migrations.AlterField(
            model_name='aireviewsession',
            name='status',
            field=models.CharField(
                choices=[('in_progress', 'In Progress'), ('submitted', 'Submitted'),
                         ('reviewed', 'Reviewed'), ('archived', 'Archived')],
                default='in_progress', max_length=20, db_index=True,
            ),
        ),
        migrations.AlterField(
            model_name='aireviewsession',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, db_index=True),
        ),
        migrations.AddIndex(
            model_name='aireviewsession',
            index=models.Index(fields=['user', 'status'], name='ai_session_user_status_idx'),
        ),
        # EssayFeedback
        migrations.AlterField(
            model_name='essayfeedback',
            name='reviewed_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        # ChatMessage
        migrations.AlterField(
            model_name='chatmessage',
            name='role',
            field=models.CharField(
                choices=[('user', 'User'), ('ai', 'AI')], max_length=10, db_index=True,
            ),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
    ]
