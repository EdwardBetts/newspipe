#! /usr/bin/env python
# -*- coding: utf-8 -*-

import os
import logging
from werkzeug import generate_password_hash
from bootstrap import application, db, conf, set_logging
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand

import web.models
from web.controllers import UserController

logger = logging.getLogger('manager')

Migrate(application, db)

manager = Manager(application)
manager.add_command('db', MigrateCommand)


@manager.command
def db_empty():
    "Will drop every datas stocked in db."
    with application.app_context():
        web.models.db_empty(db)


@manager.command
def db_create():
    "Will create the database from conf parameters."
    admin = {'is_admin': True, 'is_api': True, 'is_active': True,
             'nickname': 'admin',
             'pwdhash': generate_password_hash(
                            os.environ.get("ADMIN_PASSWORD", "password")),
             'email': os.environ.get("ADMIN_EMAIL", "root@newspipe.localhost")}
    with application.app_context():
        db.create_all()
        UserController(ignore_context=True).create(**admin)


@manager.command
def fetch(limit=100, retreive_all=False):
    "Crawl the feeds with the client crawler."
    from crawler.http_crawler import CrawlerScheduler
    scheduler = CrawlerScheduler(conf.API_LOGIN, conf.API_PASSWD)
    scheduler.run(limit=limit, retreive_all=retreive_all)
    scheduler.wait()


@manager.command
def fetch_asyncio(user_id=None, feed_id=None):
    "Crawl the feeds with asyncio."
    import asyncio

    with application.app_context():
        from crawler import classic_crawler
        filters = {}
        filters['is_active'] = True
        filters['automatic_crawling'] = True
        if None is not user_id:
            filters['id'] = user_id
        users = UserController().read(**filters).all()

        try:
            feed_id = int(feed_id)
        except:
            feed_id = None

        loop = asyncio.get_event_loop()
        for user in users:
            logger.info("Fetching articles for " + user.nickname)
            classic_crawler.retrieve_feed(loop, user, feed_id)
        loop.close()


if __name__ == '__main__':
    manager.run()
