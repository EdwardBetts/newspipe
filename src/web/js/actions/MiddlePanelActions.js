var JarrDispatcher = require('../dispatcher/JarrDispatcher');
var ActionTypes = require('../constants/JarrConstants');
var jquery = require('jquery');
var MiddlePanelStore = require('../stores/MiddlePanelStore');

var _last_fetched_with = {};

var reloadAndDispatch = function(dispath_payload) {
    var filters = MiddlePanelStore.getRequestFilter(
                dispath_payload.display_search);
    MiddlePanelStore.filter_whitelist.map(function(key) {
        if(key in dispath_payload) {
            filters[key] = dispath_payload[key];
        }
        if(filters[key] == null) {
            delete filters[key];
        }
    });
    if('display_search' in filters) {
        delete filters['display_search'];
    }
    jquery.getJSON('/middle_panel', filters,
            function(payload) {
                console.log(payload);
                dispath_payload.articles = payload.articles;
                dispath_payload.filters = filters;
                JarrDispatcher.dispatch(dispath_payload);
                _last_fetched_with = MiddlePanelStore.getRequestFilter();
    });
}


var MiddlePanelActions = {
    reload: function() {
        reloadAndDispatch({
            type: ActionTypes.RELOAD_MIDDLE_PANEL,
        });
    },
    search: function(search) {
        reloadAndDispatch({
            type: ActionTypes.RELOAD_MIDDLE_PANEL,
            display_search: true,
            query: search.query,
            search_title: search.title,
            search_content: search.content,
        });
    },
    search_off: function() {
        reloadAndDispatch({
            type: ActionTypes.RELOAD_MIDDLE_PANEL,
            display_search: false,
        });
    },
    removeParentFilter: function() {
        reloadAndDispatch({
            type: ActionTypes.PARENT_FILTER,
            filter_type: null,
            filter_id: null,
        });
    },
    setCategoryFilter: function(category_id) {
        reloadAndDispatch({
            type: ActionTypes.PARENT_FILTER,
            filter_type: 'category_id',
            filter_id: category_id,
        });
    },
    setFeedFilter: function(feed_id) {
        reloadAndDispatch({
            type: ActionTypes.PARENT_FILTER,
            filter_type: 'feed_id',
            filter_id: feed_id,
        });
    },
    setFilter: function(filter) {
        reloadAndDispatch({
            type: ActionTypes.MIDDLE_PANEL_FILTER,
            filter: filter,
        });
    },
    changeRead: function(category_id, feed_id, article_id, new_value){
        jquery.ajax({type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({readed: new_value}),
                url: "api/v2.0/article/" + article_id,
                success: function () {
                    JarrDispatcher.dispatch({
                        type: ActionTypes.CHANGE_ATTR,
                        attribute: 'read',
                        value_bool: new_value,
                        value_num: new_value ? -1 : 1,
                        articles: [{article_id: article_id,
                                    category_id: category_id,
                                    feed_id: feed_id}],
                    });
                },
        });
    },
    changeLike: function(category_id, feed_id, article_id, new_value){
        jquery.ajax({type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({like: new_value}),
                url: "api/v2.0/article/" + article_id,
                success: function () {
                    JarrDispatcher.dispatch({
                        type: ActionTypes.CHANGE_ATTR,
                        attribute: 'liked',
                        value_bool: new_value,
                        value_num: new_value ? -1 : 1,
                        articles: [{article_id: article_id,
                                    category_id: category_id,
                                    feed_id: feed_id}],
                    });
                },
        });
    },
    markAllAsRead: function() {
        var filters = MiddlePanelStore.getRequestFilter();
        jquery.ajax({type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(filters),
                url: "/mark_all_as_read",
                success: function (payload) {
                    console.log(payload);
                    JarrDispatcher.dispatch({
                        type: ActionTypes.MARK_ALL_AS_READ,
                        articles: payload.articles,
                    });
                },
        });
    },
};

module.exports = MiddlePanelActions;
