from django.conf.urls.defaults import *

urlpatterns = patterns('signoff.views',
    (r'^\/?$', 'index'),
    (r'^\/test$', 'dstest'),
    (r'^\/([^/]+)\/l10n-changesets', 'l10n_changesets'),
    (r'^\/([^/]+)\/shipped-locales', 'shipped_locales'),
    (r'^\/locales\/?$', 'locale_list'),
    (r'^\/locales\/(?P<loc>[^\/]+)', 'milestone_list'),
    (r'^\/milestones\/?$', 'milestone_list'),
    (r'^\/milestones\/(?P<ms>.+)$', 'locale_list'),
    (r'^\/(?P<arg>[^\/]+)?\/(?P<arg2>[^\/]+)?$', 'sublist'),
)