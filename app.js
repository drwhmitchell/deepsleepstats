//************************************************************************************************* */
//************************************   GLOBALS    ****************************************** */
//************************************************************************************************* */
const chartViewOpts = [{name: 'Week', days: 7}, {name: 'Month', days: 31}, {name: 'Year', days: 365}]
const defaultView = chartViewOpts[1];
const chartOptions = {
  scales: {
    x: {
      type: 'timeseries',
      time: {
        unit: 'day',
        displayFormats: {
          day: 'M/DD'
        },
        tooltipFormat: 'MM/DD/YYYY'
      }
    },
    y: {
      min: 0
    }
  }
};
const stats = [
  {
    ctx: null,
    chart: null,
    canvasId:  'timeSeriesChart1',
    name: 'New Signup Summary',
    views: chartViewOpts,
    selectedView: defaultView,
    activityType: "newsignups"
  },
  {
    ctx: null,
    chart: null,
    canvasId:  'timeSeriesChart2',
    name: 'Active Users per Day',
    views: chartViewOpts,
    selectedView: defaultView,
    activityType: "usersynced"
  },
  {
    ctx: null,
    chart: null,
    canvasId:  'timeSeriesChart3',
    name: 'Total Activity per Day',
    views: chartViewOpts,
    selectedView: defaultView,
    activityType: "countAppOpened"
  }
];

//************************************************************************************************* */
//************************************   APP    ****************************************** */
//************************************************************************************************* */
const sleepStatsApp = new Vue({
    el:'#sleepstatsapp',
    mounted(){
        let index = 0;
        this.stats.forEach(stat=>{
          stat.ctx = document.getElementById(stat.canvasId).getContext('2d');
          this.getDeepSleepStats(stat,index);
          index++;
        });
    },
    data(){
        return {
            stats:stats
        }
    },
    methods:{
       updateStatView(statIndex, view){
          let stat = this.stats[statIndex];
          stat.selectedView = view;
          this.getDeepSleepStats(stat, statIndex);
       },
       getDeepSleepStats(stat, statIndex) {
        let dayOffset = 0;
        fetch(`https://sleepnet.appspot.com/api/admin/pacific/${stat.activityType}/${dayOffset}/1/${stat.selectedView.days}`)
          .then(response => response.text())
          .then(responseData => {
            this.plotStats(stat, JSON.parse(responseData));
          });
      },
      // Plots the stats in a time-series graph
      plotStats(stat, statsObj) {
        const dataSet = [];
        const len = statsObj.length;
        for (let i = 0; i < len; i++) {
          dataSet[len - 1 - i] = statsObj[i].value;
        }
        const labels = [];
        const numDays = statsObj.length;
        const startDate = moment().subtract(numDays - 1, 'days').format('MM/DD/YYYY');
        for (let i = 0; i < numDays; i++) {
          const date = moment(startDate).add(i, 'days').format('MM/DD/YYYY');
          labels.push(date.toString());
        }
        this.createChart(stat, labels, dataSet);
      },
      // Creates a Chart.js chart in the CTX with the ChartName, with the labels, data, and chart options
      createChart(stat, labelArr, dataArr) {
        if(stat.chart){
          stat.chart.destroy();
        }
        stat.chart = new Chart(stat.ctx, {
          type: 'line',
          data: {
            labels: labelArr,
            datasets: [{
              label: stat.activityType,
              data: dataArr,
              borderWidth: 3,
              borderColor: 'rgb(0, 0, 204)',
            }]
          },
          options: chartOptions,
        });
      }
    },
    computed:{
      loggedIn(){
        return true
      }
    }
});


  


  
  

  