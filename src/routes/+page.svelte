<script lang="ts">
  import { getStocks } from "$lib/auth";
  import StockPopup from "$lib/components/StockPopup.svelte";
  import type { Price, Stock } from "$lib/interfaces";
  import { Timestamp } from "firebase/firestore";
  import { onMount } from "svelte";

  import * as echarts from 'echarts';
  import type { ECharts, EChartsOption } from "echarts";
  import { slide } from "svelte/transition";

  let stockList: Stock[] = [];
  let toggleList: Boolean[] = [];
  let chartToggleList: Boolean[] = [];
  
  let showPopup = false;
  let selectedStock: Stock | null = null;
  let charts: (ECharts | null)[] = [];

  let chartList: (HTMLElement | null)[];

  const tempOption: EChartsOption = {
    xAxis: {
      data: []
    },
    yAxis: {},
    series: {
      type: 'candlestick',
      data: []
    },
    backgroundColor: '#00000000'
  };

  function openPopup(stock: Stock) {
    selectedStock = stock;
    showPopup = true;
  }

  onMount(async () => {    
    stockList = await getStocks();
    toggleList = new Array(stockList.length).fill(true);
    chartToggleList = new Array(stockList.length).fill(false);
    chartList = new Array(stockList.length).fill(null);
    charts = new Array(stockList.length).fill(null);

    setTimeout(() => {
      chartList.forEach(c => {
        if(!c) return;
        charts[chartList.findIndex(cc => cc == c)] = echarts.init(c, 'dark');
        charts[chartList.findIndex(cc => cc == c)]?.setOption(tempOption);
      });
    }, 0)

    const websocket = new WebSocket('ws://localhost:8080');
    websocket.addEventListener('message', event => {
      // console.log(`socket message: ${event.data}`);
      const msg = (event.data as string).split("/");
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
      toggleList[index] = false;
      setTimeout(() => {
        toggleList[index] = true;
        if(chartToggleList[index]) makeChart(index);
      }, 0);
    });

    websocket.onopen = () => {
      websocket.send('socket client start');
    }
  });

  function makeChart(i: number) {
    const pl = stockList[i].priceList;
    console.log(stockList[i].name, pl.length)

    const gD = groupDates(pl);

    const keyList = Object.keys(gD).sort();

    // console.log(gD);
    
    var option: EChartsOption = tempOption;
    option.xAxis = {
      data: keyList
    }
    option.series = {
      type: 'candlestick',
      data: keyList.map(k => {
        const color = gD[k][0] < gD[k][1] ? '#FF0000' 
          : (gD[k][0] > gD[k][1] ? '#0000FF' : '#888888');
        return {
          itemStyle: {
            color: color,
            borderColor: color,
          },
          value: gD[k]
        }
        }),
    };
    setTimeout(() => {
      if (!charts[i])
        charts[i] = echarts.init(chartList[i], 'dark');
      option && charts[i]?.setOption(option);
    }, 0);
  }

  function groupDates(priceList: Price[]): Record<string, [number, number, number, number]> {
    const result: Record<string, [number, number, number, number]> = {};

    priceList.forEach((item) => {
      const timeKey = item.time.toDate().toISOString().split(":")[0];

      if (!result[timeKey]) {
        result[timeKey] = [item.value, item.value, item.value, item.value];
      } else {
        const [start, end, min, max] = result[timeKey];
        result[timeKey] = [start, item.value, Math.min(min, item.value), Math.max(max, item.value)];
      }
    });

    const resultKeys = Object.keys(result);
    resultKeys.sort();

    var preKey: string | null = null;

    resultKeys.forEach(k => {
      if (preKey) {
        const preDate = new Date(preKey + ":00:00Z");
        const currentDate = new Date(k + ":00:00Z");

        var timeDiff = (currentDate.getTime() - preDate.getTime()) / 3600000;
        const end = result[preKey][1];
        for (let i = 1; i < timeDiff; i++) {
          result[new Date(preDate.getTime() + 3600000).toISOString().split(":")[0]] 
            = [end, end, end, end];
        }

        preKey = k;
      }
      preKey = k;
    })

    return result;
  }
</script>

<main>
  <div class="stock-tile">
    {#each stockList as stock, i (stock.name)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      
      <div class="stock-item">
        <div class="stock-info" on:click={() => openPopup(stock)}>
          <div>
            <span class="stock-name">{stock.name}</span>
            <span class="stock-desc">{stock.description}</span>
          </div>
          {#if toggleList[i]}
          <div>
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
          {/if}
        </div>
        <button class="fold" 
          on:click={() => {
            chartToggleList[i] = !chartToggleList[i];
            if (chartToggleList[i]) makeChart(i);
          }}>v</button>
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

  <StockPopup bind:showPopup bind:stock={selectedStock} />
</main>

<style>
  main {
    text-align: center;
    padding: 15px 5px 0px 5px;
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
      align-self: flex-end;
      cursor: pointer;
    }
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
