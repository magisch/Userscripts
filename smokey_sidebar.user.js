// ==UserScript==
// @name        Longer Sidebar
// @desc        Makes the sidebar longer for symmetry by using recent Smokey reports.
// @author      ArtOfCode
// @version     0.6.1
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/smokey_sidebar.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/smokey_sidebar.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @grant       none
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
// ==/UserScript==

'use strict';

var userscript = function($) {
    function getSmokeyReports(number, callback) {
        var url = "https://metasmoke.erwaysoftware.com/posts/recent.json";
        $.ajax({
            url: url,
            type: 'GET',
            data: {
                'size': number
            }
        })
        .done(function(data) {
            callback(true, data);
        })
        .error(function(jqXHR, textStatus, errorThrown) {
            callback(false, jqXHR);
            console.error("XMLHttpRequest to metasmoke failed. Details follow.");
            console.log({
                type: 'IncompleteXhrException',
                message: 'The XMLHttpRequest did not complete.',
                status: textStatus,
                error: errorThrown,
                response: jqXHR.responseText
            });
        });
    }

    function getAvailableSpace() {
        return $("#mainbar").height() - $("#sidebar").height();
    }

    function addPostFeedback(id, feedback, state, callback) {
        $.ajax({
            "type": "POST",
            "url": "https://metasmoke.erwaysoftware.com/api/w/post/" + id + "/feedback",
            "xhrFields": {
                "withCredentials": true
            },
            "data": {
                "type": feedback,
                "key": "9f2d0243d7a7fee2c3af0408aec1fe50327c428096f663a37f3e9cfbae2ef01b"
            }
        })
        .done(function(data) {
            callback(true, state, data);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            callback(false, state, jqXHR);
            StackExchange.helpers.showErrorMessage($('.topbar'), "Error while feeding back to metasmoke.", {
              'position': 'toast',
              'transient': true,
              'transientTimeout': 10000
            });
        });
    }

    var AVERAGE_REPORT_HEIGHT = 80;

    if(getAvailableSpace() >= AVERAGE_REPORT_HEIGHT) {
        getSmokeyReports(Math.floor(getAvailableSpace() / AVERAGE_REPORT_HEIGHT), function(success, data) {
            var $module = $("<div class='module'></div>");
            $module.append("<h3>SmokeDetector Reports</h3>");
            var $list = $("<ul></ul>");
            $list.css("list-style-type", "square");
            if(success) {
                for(var i = 0; i < data.length; i++) {
                    var dt = new Date(data[i].created_at);
                    $("<li></li>")
                    .append("<img style='padding-right: 5px;' src='" + data[i].site_logo + "' height='16px' width='16px' />")
                    .append("<a style='padding-bottom: 5px;' href='" + data[i].link + "'>" + data[i].title + "</a>")
                    .append(" at " + dt.toLocaleTimeString())
                    .append("<br/>")
                    .append("<a class='ms-report' href='#' data-postid='" + data[i].id + "' data-feedback='tp'>✓</a>")
                    .append("<a class='ms-report' href='#' data-postid='" + data[i].id + "' data-feedback='fp'>❌</a>")
                    .append("<a class='ms-report' href='#' data-postid='" + data[i].id + "' data-feedback='naa'><b>N</b></a>")
                    .appendTo($list);
                }
                $list.appendTo($module);
                $module.appendTo("#sidebar");
            }
            else {
                $module.append("<em>Unavailable right now - XHR incomplete, check console.</em>");
                $module.appendTo("#sidebar");
            }

            $(".ms-report").css("margin-left", "5px").css("margin-right", "5px");

            $(".ms-report").bind('click', function(e) {
                e.preventDefault();
                var id = $(this).data("postid");
                var feedback = $(this).data("feedback");
                var state = {
                    'id': id,
                    'feedback': feedback,
                    'parent': $(this).parent()
                }
                addPostFeedback(id, feedback, state, function(success, state, data) {
                    if(!success) {
                        alert("Failed to feed back: " + data.status);
                    }
                    else {
                        state['parent'].find(".ms-report").each(function() {
                            $(this).fadeOut(200, function() {
                                $(this).remove();
                            });
                        });
                    }
                });
            });
        });
    }
}

var el = document.createElement("script");
el.type = "application/javascript";
el.text = "(" + userscript + ")(jQuery);";
document.body.appendChild(el);
