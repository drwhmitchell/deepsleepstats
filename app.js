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
        // if (getCookie('ds_auth')) {
        //   this.ds_auth = JSON.parse(getCookie('ds_auth'));
        //   setTimeout(()=>{
        //     this.initStats();
        //   }, 500);
        // }
        setTimeout(()=>{
          this.initStats();
        }, 500);
    },
    data(){
        return {
            stats:stats,
            ds_auth: null,
            // Login stuff
            login_error_msg: null,
            login_params: {
              data: {
                email: null,
                password: null
              },
              remember_me: false,
              show_password: false
            }
        }
    },
    methods:{
      async login(){
        var headers = new Headers();
        headers.append("Content-Type", "application/json");
        var requestOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(this.login_params.data),
          redirect: 'follow'
        };
        let response = await makeApiCall("https://sleepnet.appspot.com/api/login", requestOptions);
        if (response) {
          if (response.result != 'success') {
            this.login_error_msg = 'Login Failed: ' + response.message;
          } else {
            if (this.login_params.remember_me) {
              setCookie("ds_auth", JSON.stringify(response));
            } else {
              eraseCookie("ds_auth");
            }
            this.ds_auth = response;
            setTimeout(this.initStats, 500)
          }
        } else {
          this.login_error_msg = 'Login Failed: Internal Server Error'
        }
      },
      async logout() {
        const callback = () => {
          this.ds_auth = null;
          eraseCookie("_SleepNetSession");
          eraseCookie("ds_auth");
          location.reload();
        };
        let result = await makeApiCall("https://sleepnet.appspot.com/api/logout", this.oldGetRequestOptions('DELETE'));
        callback(result);
      },
      initStats(){
        let index = 0;
        this.stats.forEach(stat=>{
          stat.ctx = document.getElementById(stat.canvasId).getContext('2d');
          this.getDeepSleepStats(stat);
          index++;
        });
      },
       changeStatView(statIndex, view){
          let stat = this.stats[statIndex];
          stat.selectedView = view;
          this.getDeepSleepStats(stat);
       },
       getDeepSleepStats(stat) {
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
      isAuthorized() {
        //return this.ds_auth;
        return true;
      }
    }
});


async function makeApiCall(path, options) {
  let response;
  await fetch(path, options)
    .then(res => res.json())
    .then(dataBack => {
      if (dataBack) {
        response = dataBack;
      }
    });
  return (response);
}
  
function getCookie(cookie_name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${cookie_name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

function eraseCookie(cookie_name) {
  document.cookie = cookie_name + '=';
};

function setCookie(cookie_name, data) {
  document.cookie = cookie_name + '=' + data;
};
  
  

  