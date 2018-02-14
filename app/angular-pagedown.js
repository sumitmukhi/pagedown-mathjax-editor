// Mardown Extra Options
var mdExtraOptions = {
    extensions: "all",
    table_class: 'table'
};

// adapted from http://stackoverflow.com/a/20957476/940030
angular.module("ui.pagedown", [])
    .directive("pagedownEditor", ['$compile', '$timeout', '$window', '$q', function($compile, $timeout, $window, $q) {
        var nextId = 0;
        var converter = Markdown.getSanitizingConverter();

        MathJax.Hub.Config({
            "HTML-CSS": {
                preferredFont: "TeX",
                availableFonts: ["STIX", "TeX"],
                linebreaks: { automatic: true },
                EqnChunk: (MathJax.Hub.Browser.isMobile ? 10 : 50)
            },
            tex2jax: {
                inlineMath: [
                    ["$", "$"]
                ],
                displayMath: [
                    ["$$", "$$"],
                    ["$$$", "$$$"]
                ],
                processEscapes: true,
                ignoreClass: "tex2jax_ignore|dno"
            },
            TeX: {
                noUndefined: {
                    attributes: {
                        mathcolor: "red",
                        mathbackground: "#FFEEEE",
                        mathsize: "90%"
                    }
                },
                Macros: { href: ["#2", 2] }
            },
            messageStyle: "none",
            skipStartupTypeset: true
        });

        console.warn('load huya');
        Markdown.Extra.init(converter, mdExtraOptions);

        converter.hooks.chain("preBlockGamut", function(text, rbg) {
            return text.replace(/^ {0,3}""" *\n((?:.*?\n)+?) {0,3}""" *$/gm, function(whole, inner) {
                return "<blockquote>" + rbg(inner) + "</blockquote>\n";
            });
        });

        return {
            restrict: "E",
            scope: {
                content: "=",
                placeholder: "@",
                showPreview: "@",
                help: "&",
                insertImage: "&",
                editorClass: "=",
                editorRows: "@",
                previewClass: "=",
                previewContent: "="
            },
            link: function(scope, element, attrs) {

                var editorUniqueId;

                if (attrs.id == null) {
                    editorUniqueId = nextId++;
                } else {
                    editorUniqueId = attrs.id;
                }

                // just hide the preview, we still need it for "onPreviewRefresh" hook
                var previewHiddenStyle = scope.showPreview == "false" ? "display: none;" : "";

                var placeholder = attrs.placeholder || "";
                var editorRows = attrs.editorRows || "10";

                var newElement = $compile(
                    '<div>' +
                    '<div class="wmd-panel">' +
                    '<div id="wmd-button-bar-' + editorUniqueId + '"></div>' +
                    '<textarea id="wmd-input-' + editorUniqueId + '" placeholder="' + placeholder + '" ng-model="content"' +
                    ' rows="' + editorRows + '" ' + (scope.editorClass ? 'ng-class="editorClass"' : 'class="wmd-input"') + '>' +
                    '</textarea>' +
                    '</div>' +
                    '<div id="wmd-preview-' + editorUniqueId + '" style="' + previewHiddenStyle + '"' +
                    ' ' + (scope.previewClass ? 'ng-class="previewClass"' : 'class="wmd-panel wmd-preview"') + '>' +
                    '</div>' +
                    '</div>')(scope);

                // html() doesn't work
                element.append(newElement);

                var help = angular.isFunction(scope.help) ? scope.help : function() {
                    // redirect to the guide by default
                    $window.open("http://daringfireball.net/projects/markdown/syntax", "_blank");
                };

                var editor = new Markdown.Editor(converter, "-" + editorUniqueId, {
                    handler: help
                });

                if (scope.previewContent) {
                    converter.hooks.chain("postConversion", function(text) {
                        // update
                        scope.previewContent = text;
                    });
                }

                var editorElement = angular.element(document.getElementById("wmd-input-" + editorUniqueId));

                // add watch for content
                if (scope.showPreview != "false") {
                    scope.$watch('content', function() {
                        editor.refreshPreview();
                    });
                }
                editor.hooks.chain("onPreviewRefresh", function() {
                    // wire up changes caused by user interaction with the pagedown controls
                    // and do within $apply
                    $timeout(function() {
                        var mjpd = new MJPD(); // create a new MJPD for each editor on the page
                        mjpd.Editing.prepareWmdForMathJax(editor, editorUniqueId, [
                            ["$", "$"],
                            ["$$", "$$"]
                        ]);
                        scope.content = editorElement.val();
                    });
                });

                if (angular.isFunction(scope.insertImage)) {
                    editor.hooks.set("insertImageDialog", function(callback) {
                        // expect it to return a promise or a url string
                        var result = scope.insertImage();

                        // Note that you cannot call the callback directly from the hook; you have to wait for the current scope to be exited.
                        // https://code.google.com/p/pagedown/wiki/PageDown#insertImageDialog
                        $timeout(function() {
                            if (!result) {
                                // must be null to indicate failure
                                callback(null);
                            } else {
                                // safe way to handle either string or promise
                                $q.when(result).then(
                                    function success(imgUrl) {
                                        callback(imgUrl);
                                    },
                                    function error(reason) {
                                        callback(null);
                                    }
                                );
                            }
                        });

                        return true;
                    });
                }

                editor.run();
            }
        }
    }])
    .directive("pagedownViewer", ['$compile', '$sce', '$sanitize', function($compile, $sce, $sanitize) {
        var converter = Markdown.getSanitizingConverter();
        console.warn(new Date());
        MathJax.Hub.Config({
            "HTML-CSS": {
                preferredFont: "TeX",
                availableFonts: ["STIX", "TeX"],
                linebreaks: { automatic: true },
                EqnChunk: (MathJax.Hub.Browser.isMobile ? 10 : 50)
            },
            tex2jax: {
                inlineMath: [
                    ["$", "$"]
                ],
                displayMath: [
                    ["$$", "$$"],
                    ["$$$", "$$$"]
                ],
                processEscapes: true,
                ignoreClass: "tex2jax_ignore|dno"
            },
            TeX: {
                noUndefined: {
                    attributes: {
                        mathcolor: "red",
                        mathbackground: "#FFEEEE",
                        mathsize: "90%"
                    }
                },
                Macros: { href: ["#2", 2] }
            },
            messageStyle: "none",
            skipStartupTypeset: true
        });
        console.warn('aaya yeh');
        Markdown.Extra.init(converter, mdExtraOptions);

        return {
            restrict: "E",
            scope: {
                content: "="
            },
            link: function(scope, element, attrs) {

                var run = function run() {
                    if (!scope.content) {
                        scope.sanitizedContent = '';
                        return;
                    } else {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, String(element[0])]);
                        scope.sanitizedContent = $sce.trustAsHtml(converter.makeHtml(scope.content));
                    }
                };

                scope.$watch("content", run);
                run();

                var newElementHtml = "<p ng-bind-html='sanitizedContent'></p>";
                var newElement = $compile(newElementHtml)(scope);

                element.append(newElement);
                console.warn(element);
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, String(element[0])]);
                // 

            },
            // controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            //     $scope.$watch($attrs.mathjaxBind, function(value) {
            //         $element.text(value == undefined ? "" : value);
            //             var html = $sanitize(converter.makeHtml($element.text()));
            //             $element.html(html);
            //         MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);                
            //     });
            // }]
        }
    }]);