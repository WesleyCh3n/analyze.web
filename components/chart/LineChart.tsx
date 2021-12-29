import * as d3 from "d3";
import { IData } from "./Dataset";
import { layout, xScale } from "./Draw.var";

export function createLineChart(divSelector: string) {
  var svg = d3
    .select("#" + divSelector)
    .append("svg") // global chart svg w/h
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${layout.width} ${layout.lineHeight}`)
    .append("g") // workground group
    .attr("transform", `translate(${layout.margin.l} ,${layout.margin.t})`);

  svg
    .append("g") // x axis group
    .attr("class", "axis axis__x")
    .attr("transform", `translate(0, ${layout.getLineHeight()})`);

  svg
    .append("g") // y axis group
    .attr("class", "axis axis__y");

  svg
    .append("path") // line path group
    .attr("class", "line") // Assign a class for styling
    .attr("fill", "none")
    .attr("stroke", "steelblue");

  function update(data: IData[], first: boolean) {
    var h = layout.getLineHeight();

    if (first) {
      xScale.domain(d3.extent(data, (d) => d.x).map((x) => x ?? 0));
    }
    // prepare scale
    var yScale = d3
      .scaleLinear()
      .range([h, 0])
      .domain(d3.extent(data, (d) => d.y).map((y) => y ?? 0));

    // prepare axisGen
    var xAxisGen = d3.axisBottom(xScale);
    var yAxisGen = d3.axisLeft(yScale);

    // region x/y axis
    svg.select(".axis__x").call(xAxisGen as any); // TODO: fix type
    svg.select(".axis__y").call(yAxisGen as any); // TODO: fix type

    svg
      .append("defs") // region clip path
      .append("clipPath")
      .attr("id", "chart-path")
      .append("rect") // region clip rect
      .attr("fill", "black")
      .attr("width", layout.getWidth())
      .attr("height", h);

    svg
      .select(".line") // region line/area
      .datum(data)
      .transition()
      .attr("clip-path", "url(#chart-path)")
      .attr("fill", "none")
      .attr(
        "d",
        d3
          .line<IData>()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y))
      );

    var tooltipGroup = svg
      .append("g")
      .attr("class", "tooltip__group")
      .style("display", "none");

    tooltipGroup.append("circle").attr("fill", "black").attr("r", 2);

    tooltipGroup
      .append("rect")
      .attr("class", "tooltip")
      .attr("fill", "rgba(0,0,0,0.7)")
      .attr("stroke", "none")
      .attr("width", 80)
      .attr("height", 50)
      .attr("x", 10)
      .attr("y", -22)
      .attr("rx", 5)
      // .attr("ry", 10);

    tooltipGroup
      .append("text")
      .attr("class", "tooltip-x")
      .attr("fill", "#fff")
      .attr("x", 18)
      .attr("y", -2);

    tooltipGroup
      .append("text")
      .attr("class", "tooltip-y")
      .attr("fill", "#fff")
      .attr("x", 18)
      .attr("y", 18);

    const bisectX = d3.bisector((d: IData) => d.x).center;
    svg
      .append("rect")
      .attr("class", "overlay")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("width", layout.getWidth())
      .attr("height", layout.getLineHeight())
      .on("mouseover", function () {
        tooltipGroup.style("display", null);
      })
      .on("mouseout", function () {
        tooltipGroup.style("display", "none");
      })
      .on("mousemove", (event: any) => {
        var x0 = xScale.invert(d3.pointer(event)[0]),
          i = bisectX(data, x0),
          d0 = data[i - 1],
          d1 = data[i];
        if (!d0 || !d1) return;
        var d = x0 - d0.x > d1.x - x0 ? d1 : d0;
        tooltipGroup.attr(
          "transform",
          `translate( ${xScale(d.x)}, ${yScale(d.y)})`
        );
        tooltipGroup.select(".tooltip-x").text(`x: ${d.x}`);
        tooltipGroup.select(".tooltip-y").text(`y: ${d.y.toFixed(3)}`);
      });
  }
  return update;
}