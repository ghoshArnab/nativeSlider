var pxSlider = function() {
    function extend() {
        var i, key, base = Array.prototype.shift.call(arguments);
        for (i = 0; i < arguments.length; i++)
            for (key in arguments[i]) arguments[i].hasOwnProperty(key) && (base[key] = arguments[i][key]);
        return base;
    }

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this,
                args = arguments,
                later = function() {
                    timeout = null, immediate || func.apply(context, args);
                },
                callNow = immediate && !timeout;
            clearTimeout(timeout), timeout = setTimeout(later, wait), callNow && func.apply(context, args);
        };
    }

    function getOffset(node) {
        var bodyDims = document.body.getBoundingClientRect(),
            nodeDims = node.getBoundingClientRect(),
            offsets = {
                left: nodeDims.left - bodyDims.left,
                max: nodeDims.left - bodyDims.left + node.clientWidth
            };
        return offsets;
    }

    function createSpan(spanElem, classes, spanText) {
        classes.forEach(function(value, index, array) {
            spanElem.classList.add(value);
        });
        spanElem.firstChild.appendChild(document.createTextNode(spanText));

        spanElem.setAttribute("data-rs-value", spanText);
        return spanElem;
    }

    function setDefault(attr, fallBack) {
        return attr ? attr.value : fallBack;
    }

    function pxSlider(node, options) {
        if (!node) return void console.info("No Slider element");
        this.config = {
            steps: setDefault(node.attributes["data-rs-steps"], false),
            min: parseInt(setDefault(node.attributes["data-rs-min"], 0)),
            max: parseInt(setDefault(node.attributes["data-rs-max"], 100)),
            onSlide: function() {},
            afterInit: function() {}
        };
        this.config = extend(this.config, options);
        this.baseElement = node;
        this.isStepped = false;
        this.init(node);
        var slider = this;
        this.slide(this.sliderWidth, "%");
        this.pointer.addEventListener("mousedown", function(ev) {
            if (1 !== ev.which) return;
            ev.preventDefault();
            ev.stopPropagation();
            slider.isFocussed = true;
            if (0 === slider.ptDrag.minOffset || 0 === slider.ptDrag.maxOffset) {
                slider.initDragObject();
                slider.width = node.clientWidth;
            }

            slider.ptDrag.start = this.style.left;
            this.classList.remove("transitionable");
            slider.progress.classList.remove("transitionable");
        });
        window.addEventListener("mousemove", debounce(function(ev) {
            var finalOffset, pointerCoors, offset;
            if (true === slider.isFocussed) {
                if (ev.clientX < slider.ptDrag.minOffset) {
                    finalOffset = slider.evalPosition(slider.ptDrag.minOffset);
                }
                if (ev.clientX > slider.ptDrag.maxOffset) {
                    finalOffset = slider.evalPosition(slider.ptDrag.maxOffset);
                }
                if (ev.clientX > slider.ptDrag.minOffset && ev.clientX < slider.ptDrag.maxOffset) {
                    finalOffset = slider.evalPosition(ev.clientX);
                }
                slider.slide(finalOffset, "%");
                pointerCoors = getOffset(slider.pointer);
                slider.ptDrag.lastOffset = pointerCoors.left;
                if (pointerCoors.left < slider.ptDrag.minOffset) {
                    slider.ptDrag.lastOffset = slider.ptDrag.minOffset;
                }
                if (pointerCoors.left > slider.ptDrag.maxOffset) {
                    slider.ptDrag.lastOffset = slider.ptDrag.maxOffset;
                }
                offset = slider.evalPosition(slider.ptDrag.lastOffset);
                offset = Math.ceil(offset) / 100 * slider.scope;
                slider.setRange(Math.ceil(offset) + slider.config.min);
            }
        }), 350);
        window.addEventListener("mouseup", function(ev) {
            if (true === slider.isFocussed) {
                slider.isFocussed = false;
                var offset = slider.evalPosition(slider.ptDrag.lastOffset);
                offset = Math.ceil(offset) / 100 * slider.scope;
                slider.setRange(Math.ceil(offset) + slider.config.min);

                slider.pointer.classList.add("transitionable");
                slider.progress.classList.add("transitionable");
            }
        });
        window.addEventListener("resize", function(ev) {
            slider.isFocussed = false;
            slider.reInit();
        });


        if (this.isStepped) {
            Array.prototype.forEach.call(slider.ranges, function(node, index, array) {
                node.style.width = slider.sliderWidth + "%", node.addEventListener("click", function() {
                    Array.prototype.forEach.call(slider.ranges, function(node, index, array) {
                        node.classList.remove("highlighted");
                    });
                    this.classList.add("highlighted"), slider.slide((index + 1) * slider.sliderWidth, "%");
                    slider.currentRange = this.getAttribute("data-rs-value");
                    slider.config.onSlide(slider);
                });
            })
        } else {
            node.addEventListener("click", function(e) {
                if (e.target !== slider.pointer) {
                    var finalOffset = slider.evalPosition(e.clientX);
                    finalOffset = finalOffset / 100 * slider.scope;
                    slider.setRange(Math.ceil(finalOffset) + slider.config.min);
                }
            });

        }
        this.config.afterInit(slider);
    }


    pxSlider.prototype.setRange = function(value) {
        var multiplier, dropNode, move;
        value = parseInt(value);
        value = value < this.config.min ? this.config.min : value;
        value = value > this.config.max ? this.config.max : value;
        if (this.isStepped) {
            multiplier = 0, dropNode = this.scope / this.size;
            do multiplier += 1; while (this.config.min + dropNode * multiplier < value);
            this.ranges[multiplier - 1].click();
        } else {
            move = (value - this.config.min) / this.scope;
            move *= 100;
            this.currentRange = value;
            this.slide(move, "%");
        }
        this.config.onSlide(this);
    };


    pxSlider.prototype.slide = function(move, units) {
        this.pointer.style.left = (move - 1) + units;
        this.progress.style.width = move + units;
    };


    pxSlider.prototype.initDragObject = function() {
        this.width = this.baseElement.clientWidth;
        var offsets = getOffset(this.baseElement);
        this.ptDrag = {
            minOffset: offsets.left,
            maxOffset: offsets.max,
            lastOffset: 0,
            start: 0
        };
    };

    pxSlider.prototype.init = function(node) {
        this.pointer = node.children[0];
        this.progress = node.children[1];
        this.scope = this.config.max - this.config.min;
        this.currentRange = this.config.min;
        this.ptDrag = {};
        this.width = node.clientWidth;
        this.isFocussed = false;
        this.initDragObject();
        if (this.config.steps) {
            this.size = parseInt(this.config.steps);
            this.ranges = this.createNodes();
            this.sliderWidth = 100 / this.size;
            this.isStepped = true;
        }
    };

    pxSlider.prototype.reInit = function() {
        this.currentRange = this.config.min;
        this.ptDrag = {};
        this.width = this.baseElement.clientWidth;

        this.isFocussed = false;
        this.initDragObject();
    };

    pxSlider.prototype.evalPosition = function(offset) {
        return (offset - this.ptDrag.minOffset) / this.width * 100;
    };

    pxSlider.prototype.createNodes = function() {
        var i, rangeSpan;
        var slider = this;
        var aSpanClasses = ["slider", "stepped"];
        var stepValue = this.scope / this.size;
        var aNodeArray = [];

        for (i = 1; i <= slider.size; i++) {
            var rangeSpan = document.createElement("span");
            rangeSpan.appendChild(document.createElement("p"));
            switch (true) {
                case 0 === i:
                    rangeSpan = createSpan(rangeSpan, aSpanClasses, slider.config.min + i * stepValue + ""),
                        rangeSpan.classList.add("highlighted");
                    break;

                case slider.size - i === 0:
                    rangeSpan = createSpan(rangeSpan, aSpanClasses, slider.config.max);
                    break;

                default:
                    rangeSpan = createSpan(rangeSpan, aSpanClasses, Math.round(slider.config.min + i * stepValue) + "");
            }
            slider.baseElement.appendChild(rangeSpan), aNodeArray.push(rangeSpan);
        }
        return aNodeArray;
    };

    return {
        create: function(node, options) {
            var slider = new pxSlider(document.querySelector(node), options);
            return slider;
        }
    };
}();