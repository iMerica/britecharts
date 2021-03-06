define(function(require){
    'use strict';

    const d3 = require('d3');

    const d3Format = require('d3-format');
    const d3Scale = require('d3-scale');
    const d3Selection = require('d3-selection');
    const d3Transition = require('d3-transition');

    const textHelper = require('./helpers/text');
    const colorHelper = require('./helpers/colors');

    /**
     * @typedef LegendChartData
     * @type {Object[]}
     * @property {Number} id        Id of the group (required)
     * @property {Number} quantity  Quantity of the group (required)
     * @property {String} name      Name of the group (required)
     *
     * @example
     * [
     *     {
     *         id: 1,
     *         quantity: 2,
     *         name: 'glittering'
     *     },
     *     {
     *         id: 2,
     *         quantity: 3,
     *         name: 'luminous'
     *     }
     */


    /**
     * @fileOverview Legend Component reusable API class that renders a
     * simple and configurable legend element.
     *
     * @example
     * var donutChart = donut(),
     *     legendBox = legend();
     *
     * donutChart
     *     .externalRadius(500)
     *     .internalRadius(200)
     *     .on('customMouseOver', function(data) {
     *         legendBox.highlight(data.data.id);
     *     })
     *     .on('customMouseOut', function() {
     *         legendBox.clearHighlight();
     *     });
     *
     * d3Selection.select('.css-selector')
     *     .datum(dataset)
     *     .call(donutChart);
     *
     * d3Selection.select('.other-css-selector')
     *     .datum(dataset)
     *     .call(legendBox);
     *
     * @module Legend
     * @tutorial legend
     * @exports charts/legend
     * @requires d3
     */
    return function module() {

        let margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            width = 320,
            height = 180,

            lineMargin = 12,

            circleRadius = 8,
            circleYOffset = -5,

            textSize = 12,
            textLetterSpacing = 0.5,

            valueReservedSpace = 40,
            numberLetterSpacing = 0.8,
            numberFormat = d3Format.format('s'),

            isFadedClassName = 'is-faded',
            inline = false,

            // colors
            colorScale,
            colorSchema = colorHelper.colorSchemas.britechartsColorSchema,

            getId = ({id}) => id,
            getName = ({name}) => name,
            getFormattedQuantity = ({quantity}) => numberFormat(quantity),
            getCircleFill = ({name}) => colorScale(name),

            entries,
            chartWidth, chartHeight,
            data,
            svg;


        /**
         * This function creates the graph using the selection as container
         * @param  {D3Selection} _selection A d3 selection that represents
         *                                  the container(s) where the chart(s) will be rendered
         * @param {object} _data The data to attach and generate the chart
         */
        function exports(_selection) {
            _selection.each(function(_data){
                chartWidth = width - margin.left - margin.right;
                chartHeight = height - margin.top - margin.bottom;
                data = _data;

                buildColorScale();
                buildSVG(this);
                if (inline) {
                    drawInlineLegend();
                } else {
                    drawStackedLegend();
                }
            });
        }

        /**
         * Builds containers for the legend
         * Also applies the Margin convention
         * @private
         */
        function buildContainerGroups() {
            let container = svg
              .append('g')
                .classed('legend-container-group', true)
                .attr('transform', `translate(${margin.left},${margin.top})`);

            container
              .append('g')
                .classed('legend-group', true);
        }

        /**
         * Builds color scale for chart, if any colorSchema was defined
         * @private
         */
        function buildColorScale() {
            if (colorSchema) {
                colorScale = d3Scale.scaleOrdinal().range(colorSchema);
            }
        }

        /**
         * Builds the SVG element that will contain the chart
         * @param  {HTMLElement} container DOM element that will work as the container of the graph
         * @private
         */
        function buildSVG(container) {
            if (!svg) {
                svg = d3Selection.select(container)
                  .append('svg')
                    .classed('britechart britechart-legend', true);

                buildContainerGroups();
            }

            svg
                .transition()
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);
        }

        /**
         * Centers the legend on the chart given that is a single line of labels
         * @return {void}
         */
        function centerLegendOnSVG() {
            let legendGroupSize = svg.select('g.legend-container-group').node().getBoundingClientRect().width;
            let emptySpace = width - legendGroupSize;

            if (emptySpace > 0) {
                svg.select('g.legend-container-group')
                    .attr('transform', `translate(${emptySpace/2},0)`)
            }
        }

        /**
         * Removes the faded class from all the entry lines
         */
        function cleanFadedLines() {
            svg.select('.legend-group')
                .selectAll('g.legend-entry')
                .classed(isFadedClassName, false);
        }

        /**
         * Draws the entries of the legend within a single line
         * @private
         */
        function drawInlineLegend() {
            let circleSize = 2 * circleRadius;
            let xOffset = circleSize;

            // We want a single line
            svg.select('.legend-group')
              .append('g')
                .classed('legend-line', true);

            // And one entry per data item
            entries = svg.select('.legend-line')
              .selectAll('g.legend-entry')
              .data(data);

            // Enter
            entries.enter()
              .append('g')
                .classed('legend-entry', true)
                .attr('data-item', getId)
                .attr('transform', function(d, i) {
                    let horizontalOffset = xOffset,
                        lineHeight = chartHeight / 2,
                        verticalOffset = lineHeight,
                        labelWidth = textHelper.getTextWidth(d.name, textSize);

                    xOffset += circleSize + 2 * lineMargin + labelWidth;

                    return `translate(${horizontalOffset},${verticalOffset})`;
                })
                .merge(entries)
              .append('circle')
                .classed('legend-circle', true)
                .attr('cx', 0)
                .attr('cy', circleYOffset)
                .attr('r', circleRadius)
                .style('fill', getCircleFill)
                .style('stroke-width', 1);

            svg.select('.legend-group')
                .selectAll('g.legend-entry')
              .append('text')
                .classed('legend-entry-name', true)
                .text(getName)
                .attr('x', lineMargin)
                .style('font-size', `${textSize}px`)
                .style('letter-spacing', `${textLetterSpacing}px`);

            // Exit
            svg.select('.legend-group')
                .selectAll('g.legend-entry')
                .exit()
                .transition()
                .style('opacity', 0)
                .remove();

            centerLegendOnSVG();
        }

        /**
         * Draws the entries of the legend
         * @private
         */
        function drawStackedLegend() {
            entries = svg.select('.legend-group')
                .selectAll('g.legend-line')
                .data(data);

            // Enter
            entries.enter()
              .append('g')
                .classed('legend-line', true)
                  .append('g')
                    .classed('legend-entry', true)
                    .attr('data-item', getId)
                    .attr('transform', function(d, i) {
                        let horizontalOffset = 2 * circleRadius + lineMargin,
                            lineHeight = chartHeight/ (data.length + 1),
                            verticalOffset = (i + 1) * lineHeight;

                        return `translate(${horizontalOffset},${verticalOffset})`;
                    })
                    .merge(entries)
                  .append('circle')
                    .classed('legend-circle', true)
                    .attr('cx', 0)
                    .attr('cy', circleYOffset)
                    .attr('r', circleRadius)
                    .style('fill', getCircleFill)
                    .style('stroke-width', 1);

            svg.select('.legend-group')
                .selectAll('g.legend-line')
                .selectAll('g.legend-entry')
              .append('text')
                .classed('legend-entry-name', true)
                .text(getName)
                .attr('x', (2 * circleRadius) + lineMargin)
                .style('font-size', `${textSize}px`)
                .style('letter-spacing', `${textLetterSpacing}px`);

            svg.select('.legend-group')
                .selectAll('g.legend-line')
                .selectAll('g.legend-entry')
              .append('text')
                .classed('legend-entry-value', true)
                .text(getFormattedQuantity)
                .attr('x', chartWidth - valueReservedSpace)
                .style('font-size', `${textSize}px`)
                .style('letter-spacing', `${numberLetterSpacing}px`)
                .style('text-anchor', 'end')
                .style('startOffset', '100%');

            // Exit
            svg.select('.legend-group')
                .selectAll('g.legend-line')
                .exit()
                .transition()
                .style('opacity', 0)
                .remove();
        }

        /**
         * Applies the faded class to all lines but the one that has the given id
         * @param  {number} exceptionItemId Id of the line that needs to stay the same
         */
        function fadeLinesBut(exceptionItemId) {
            let classToFade = 'g.legend-entry';

            svg.select('.legend-group')
                .selectAll(classToFade)
                .classed(isFadedClassName, true);

            svg.select(`[data-item="${exceptionItemId}"]`)
                .classed(isFadedClassName, false);
        }

        /**
         * Clears the highlighted line entry
         */
        exports.clearHighlight = function() {
            cleanFadedLines();
        };

        /**
         * Gets or Sets the colorSchema of the chart
         * @param  {array} _x Color scheme array to get/set
         * @return {number | module} Current colorSchema or Donut Chart module to chain calls
         * @public
         */
        exports.colorSchema = function(_x) {
            if (!arguments.length) {
                return colorSchema;
            }
            colorSchema = _x;

            return this;
        };

        /**
         * Gets or Sets the height of the legend chart
         * @param  {number} _x Desired width for the chart
         * @return {height | module} Current height or Legend module to chain calls
         * @public
         */
        exports.height = function(_x) {
            if (!arguments.length) {
                return height;
            }
            height = _x;

            return this;
        };

        /**
         * Highlights a line entry by fading the rest of lines
         * @param  {number} entryId ID of the entry line
         */
        exports.highlight = function(entryId) {
            cleanFadedLines();
            fadeLinesBut(entryId);
        };

        /**
         * Gets or Sets the inline mode on the legend
         * @param  {boolean} _x Desired inline mode for the graph
         * @return {inline | module} Current inline mode or Legend module to chain calls
         * @public
         */
        exports.inline = function(_x) {
            if (!arguments.length) {
                return inline;
            }
            inline = _x;

            return this;
        };

        /**
         * Gets or Sets the margin of the legend chart
         * @param  {object} _x Margin object to get/set
         * @return {margin | module} Current margin or Legend module to chain calls
         * @public
         */
        exports.margin = function(_x) {
            if (!arguments.length) {
                return margin;
            }
            margin = _x;

            return this;
        };

        /**
         * Gets or Sets the width of the legend chart
         * @param  {number} _x Desired width for the graph
         * @return {width | module} Current width or Legend module to chain calls
         * @public
         */
        exports.width = function(_x) {
            if (!arguments.length) {
                return width;
            }
            width = _x;

            return this;
        };

        return exports;
    };

});
