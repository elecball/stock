<script lang="ts">
  import { getStocks } from "$lib/auth";
  import StockPopup from "$lib/components/StockPopup.svelte";
  import type { Price, Stock } from "$lib/interfaces";
  import { Timestamp } from "firebase/firestore";
  import { onMount } from "svelte";

  import * as echarts from 'echarts';
  import type { ECharts, EChartsOption } from "echarts";
  import { fade, slide } from "svelte/transition";
  import { writable, type Writable } from "svelte/store";

  let stockList: Stock[] = [];
  let toggleList: {}[] = [];
  let chartToggleList: Boolean[] = [];
  
  let showPopup = false;
  let selectedStock = writable<Stock | null>(null);
  let charts: (ECharts | null)[] = [];

  let selectedSpan: number[] = [];
  let spanChange = writable<number[]>([-1, 0]);
  const spans = [60 * 24, 60 * 24 * 7, 60 * 24 * 30];
  const spanGroup = [10, 60, 1440];

  let chartList: (HTMLElement | null)[];

  function openPopup(stock: Stock) {
    selectedStock.set(stock);
    showPopup = true;
  }

  onMount(async () => {    
    stockList = await getStocks();
    toggleList = new Array(stockList.length).fill({});
    chartToggleList = new Array(stockList.length).fill(false);
    chartList = new Array(stockList.length).fill(null);
    charts = new Array(stockList.length).fill(null);

    selectedSpan = new Array(stockList.length).fill(0);

    spanChange.subscribe(v => {
      selectedSpan[v[0]] = v[1];
      makeChart(v[0])
    })

    window.addEventListener('resize', (e) => {
      charts.forEach(c => {
        if (c) c.resize()
      })
    })

    setTimeout(() => {
      chartList.forEach(c => {
        if(!c) return;
        charts[chartList.findIndex(cc => cc == c)] = echarts.init(c, 'dark');
      });
    }, 0);

    const websocket = new WebSocket('ws://mc-stock.kro.kr:8080');
    websocket.addEventListener('message', event => {
      const msg = (event.data as string).split("/");
      // console.log(msg);
      stockList.map(s => {
        if (s.id != msg[0]) return s;
        const newS = s;
        newS.priceList.unshift({
          value: Number(msg[1]),
          time: new Timestamp(Number(msg[2]) / 1000, Number(msg[2]) % 1000)
        });
        return newS;
      });
      const index = stockList.findIndex(s => s.id == msg[0]);
      setTimeout(() => {
        toggleList[index] = {};
        if ($selectedStock?.id == stockList[index].id)
          selectedStock.set(stockList[index]);
        if(chartToggleList[index]) makeChart(index);
      }, 0);
    });

    websocket.onopen = () => {
      websocket.send('socket client start');
    }
  });

  function makeChart(i: number) {
    const pl = stockList[i]?.priceList;
    console.log(pl);
    if (!pl) return;


    // console.log(groupPrices(pl));
    const gpl = groupPrices(pl, spanGroup[selectedSpan[i]])
      .filter(p => new Date().getTime() - p.time.getTime() <= 60000 * spans[selectedSpan[i]]);
    // console.log(gpl);
    // pl.map(p => {
    //   const key = new Date(p.time.toDate().getTime() - (p.time.toDate().getTime() % 300000));
    //   return key.toISOString();
    // });

    // console.log(selectedSpan[i]);

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'cross',
          label: {
            // formatter: (v) => {
            //   const s = new Date(v.value).toLocaleString()
            //   return s.substring(0, s.length - 3);
            // }
          }
        },
        showContent: false
      },
      xAxis: {
        type: 'time',
        // data: pl.map(p => p.time),
        // show: false,
      },
      yAxis: {
        type: 'value',
        // show: false
        min: function (item){
          var diff = item.max - item.min;
          if(diff == 0) {diff = 1}
          return (item.min - ((diff) * 0.2)).toFixed(0);
        },
        max: function (item){
          var diff = item.max - item.min;
          if(diff == 0) {diff = 1}
          return (item.max + ((diff) * 0.2)).toFixed(0);
        },
      },
      grid: {
        // left: 0,
        // right: 0,
        // top: 0,
        // bottom: 0
      },
      series: [{
        type: 'line',
        data: gpl
          .map(p => [p.time.toISOString(), p.value]),
        showSymbol: false,
        tooltip: {
          trigger: 'axis',
        }
      }, {
        type: 'line',
        color: '#00000000',
        showSymbol: false,
        data: [
          [new Date().toISOString(), gpl[gpl.length - 1]?.value],
          [new Date(new Date().getTime() - 60000 * spans[selectedSpan[i]]).toISOString(), gpl[gpl.length - 1]?.value]],
        tooltip: {
          trigger: 'none',
        }
      }],
      backgroundColor: '#00000000'
    };

    setTimeout(() => {
      if (!charts[i]) {
        charts[i]?.dispose(); 
        charts[i] = echarts.init(chartList[i], 'dark');
      }
      option && charts[i]?.setOption(option);
    }, 0);
  }

  function groupPrices(priceList: Price[], time: number) {
    var result: Record<string, [number, number]> = {};
    priceList.forEach(p => {
      const key = new Date(p.time.toDate().getTime() - p.time.toDate().getTime() % (60000 * time)).toISOString();
      if (result[key]) {
        if (result[key][0] > p.time.toDate().getTime())
          result[key] = [p.time.toDate().getTime(), p.value]
      }
      else {
        result[key] = [p.time.toDate().getTime(), p.value]
      }
    })

    return Object.keys(result).sort().map(k => {
      return {
        time: new Date(k),
        value: result[k][1]
      }
    });
  }
</script>

<main>
  <div class="stock-tile">
    {#each stockList as stock, i (stock.name)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      
      <div class="stock-item">
        <div class="stock-info" on:click={() => openPopup(stock)}>
          <div style="width: max-content; flex-shrink: 0;">
            <span class="stock-name">{stock.name}</span>
            <span class="stock-desc">{stock.description}</span>
          </div>
          <!-- <div style="width: 100%;"/> -->
          {#key toggleList[i]}
          <div style="display: flex;"
            in:slide={{ duration: 500, delay: 100, axis: 'y'}} 
            out:fade={{ duration: 0, delay: 0 }}>
            <div class="stock-price-wrapper">
              <span class="stock-price">{(stock.priceList[0].value).toFixed(2)} USD</span>
            </div>
            <div class="stock-price-change-wrapper">
              {#if stock.priceList[0].value > stock.priceList[1].value}
                <span class="price up">+{((stock.priceList[0].value / stock.priceList[1].value - 1) * 100).toFixed(2)}%</span>
              {:else if stock.priceList[0].value < stock.priceList[1].value}
                <span class="price down">{((stock.priceList[0].value / stock.priceList[1].value - 1) * 100).toFixed(2)}%</span>
              {:else}
                <span class="price">{0}</span>
              {/if}
            </div>
          </div>
          
          {/key}
        </div>
        <div style="width:100%; display: flex; align-item: flex-start; justify-content: space-between;">
          {#if chartToggleList[i]}
          <div class="time-span-container" transition:slide={{ duration: 150 ,axis: 'x' }}>
            <button class="time-span" 
              class:selected={selectedSpan[i] == 0}
              on:click={() => spanChange.set([i, 0])}>
              1일
            </button>
            <button class="time-span" 
              class:selected={selectedSpan[i] == 1}
              on:click={() => spanChange.set([i, 1])}>
              1주일
            </button>
            <button class="time-span" 
              class:selected={selectedSpan[i] == 2}
              on:click={() => spanChange.set([i, 2])}>
              1달
            </button>
          </div>
          {:else}
          <div/>
          {/if}
          <button class="fold bx bxs-down-arrow" 
          on:click={() => {
            chartToggleList[i] = !chartToggleList[i];
            if (chartToggleList[i]) makeChart(i);
            else charts[i] = null;
          }}/>
        </div>
        
        {#if chartToggleList[i]}
        <div 
          bind:this={chartList[i]}
          transition:slide={{}}
          id="chart" 
          style="height: 300px; width: 100%;"/>
        {/if}
      </div>
    {/each}
    
  </div>
  
  {#if showPopup}
  <StockPopup 
    bind:showPopup={showPopup} 
    bind:stock={selectedStock}/>
  {/if}

</main>

<style>
  main {
    text-align: center;
    padding: 15px 3% 0px 3%;
  }

  .stock-tile {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(400px, 1fr)
    );
    grid-gap: 10px;

    & > .stock-item {
      display: flex;
      border: 1px solid var(--transparent10);
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      align-items: center;
      /* justify-content: space-between; */
      background-color: var(--transparent05);
      flex-direction: column;
      height: fit-content;
    }

    & > .stock-item > .stock-info {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    & > .stock-item > .stock-info > div:nth-child(1) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    & > .stock-item > .stock-info > div:nth-child(2) {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    & .stock-price-wrapper {
      width: 125px;
      text-align: right;
      overflow: hidden;
    }

    & .stock-price-change-wrapper {
      width: 75px;
      text-align: right;
    }

    & .stock-name,
    & .stock-price {
      font-size: 18px;
    }

    & .stock-desc {
      font-size: 14px;
      color: var(--desc);
    }

    & .fold {
      /* align-self: flex-end; */
      cursor: pointer;
      font-size: 18px;
      margin-top: 5px;
      color: white;
      border: none;
      background: none;
    }
  }

  .time-span-container {
    margin-top: 10px;
    display: flex;
    flex-wrap: nowrap;
  }

  .time-span {
    margin: 0 15px 0 0;
    font-size: 18px;
    background: none;
    color: white;
    border-bottom: 2px transparent inset;
    border-top: none;
    border-left: none;
    border-right: none;
    text-wrap: nowrap;
    cursor: pointer;
    transition: border 0.2s ease;
  }

  .time-span:not(.selected) {
    border-bottom: 2px transparent inset;
  }

  .time-span.selected {
    border-bottom: 2px #ffffff inset;
  }

  .price {
    border-radius: 5px;
    background-color: #e8eaed;
    padding: 5px;
    color: #282828;
    font-weight: 500;
  }

  .price.up {
    background-color: #e6f4ea;
    color: #137333;
  }

  .price.down {
    background-color: #fce8e6;
    color: #a50e0e;
  }

  /* 
  .stock-item {
    width: calc(33.33% - 20px);
    margin: 10px;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
  }

  .stock-info {
    display: flex;
    justify-content: space-between;
  }

  .price {
    font-weight: bold;
  } */
</style>
