'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  let yearUnit= 1960;
  //let unitMenu = d3.select("#dropdown")
  let unitMenu = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 800);

   unitMenu = d3.select("#dropdown").append("select");

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((data) => makeScatterPlot(data));

  
    
      
  }

  //drop down shit
   //dropDown = d3.select("filter").append("select")
     //              .attr("name", "country-list");
                   




  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions,yearUnit);

    // draw title and axes labels
    makeLabels(yearUnit);

    
    
  }

  // make title and axes labels
  function makeLabels(yearUnit) {

    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("World life Expectancy and Fertility Through Time ");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
    
      svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 400)
      .style('font-size', '20pt')
      .text(yearUnit );
    
      
      
      //drop down stuff
      /*
      d3.select(".buttons")
      .selectAll("button")
      .data(groups)
      .enter().append("button")
      .text(function(d) { return "Group " + d; })
      .on("click", function(d) {
  
        dataSwap(d);
      })

   */

  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map,yearUn) {

    //d3.selectAll("svg > *").remove();
   // d3.selectAll(".dot").remove();  
 //  svgContainer.selectAll('.dot').remove()

    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_data_time = data.map((row) => + row["time"]) ;
  
    let data_time_dis= new Set (pop_data_time)
    let dtd_fixed=  Array.from( data_time_dis);

    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

console.log(yearUn)

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function(d) {return d.time==yearUn })

        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["pop_mlns"]))
        .attr('fill', "#4286f4")

        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.location + "<br/>" + numberWithCommas(d["pop_mlns"]*1000000))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        }); 


 

        unitMenu.selectAll("option")  
                .data(dtd_fixed)
                .enter()
                .append("option")
                .attr("value", (d) => {return d;})
                .text((d) => {return d;});


        unitMenu.on('change', function() {

                  // find which unit was selected from the dropdown
                 let  yearUnitNew = d3.select(this)
                      //.select("select")
                      .property("value");
                  
                      updatesvgcon(yearUnitNew);

                  // run update with selected unit
                  plotData(map, yearUnitNew);
          
             });   
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }


  function updatesvgcon(UnitNew) {
    svgContainer.selectAll("*").remove();
  //  unitMenu.selectAll("*").remove();
//    unitMenu = d3.select("#dropdown");


    remakeAxis(data)
    makeLabels(UnitNew);


  }

 function remakeAxis(csvData){
  data = csvData // assign data as global variable

  let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
  let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

  let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

   drawAxes(axesLimits, "fertility_rate", "life_expectancy");


  }






})();
