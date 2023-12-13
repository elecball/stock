<script lang="ts">
  import { user, userData } from "$lib/auth";
  import type { Price, Stock, UserData } from "$lib/interfaces";
  import type { ECharts, EChartsOption } from "echarts";
  import * as echarts from 'echarts';
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import { fade } from "svelte/transition";

  export let showPopup = false;
  export let stock: Writable<Stock | null>;

  stock.subscribe(s => {
    // console.log(s?.priceList.length);
    makeChart(s);
  });

  let chartElement: HTMLElement;
  let chart: ECharts;

  let amount = 1;
  let currentAmount = 1;

  userData.subscribe(ud => {
    // console.log(ud);
    currentAmount = ud?.stocks.find(s => s.id == $stock?.id)?.amount ?? 0;
    // console.log(currentAmount);
  })

  let isBuyActive = true;

  function toggleSwitch() {
    isBuyActive = !isBuyActive;
  }

  function closePopup() {
    showPopup = false;
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

    // resultKeys.forEach(k => {
    //   if (preKey) {
    //     const preDate = new Date(preKey + ":00:00Z");
    //     const currentDate = new Date(k + ":00:00Z");

    //     var timeDiff = (currentDate.getTime() - preDate.getTime()) / 3600000;
    //     const end = result[preKey][1];
    //     for (let i = 1; i < timeDiff; i++) {
    //       result[new Date(preDate.getTime() + 3600000).toISOString().split(":")[0]] 
    //         = [end, end, end, end];
    //     }
    //   }
    //   preKey = k;
    // })

    return result;
  }

  function makeChart(s: Stock | null) {
    if (!s?.priceList) return;
    const gD = groupDates(s?.priceList);
    const keyList = Object.keys(gD).filter(p => new Date().getTime() - new Date(p + ":00:00Z").getTime() <= 60000 * 60 * 24)  .sort();

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
        // position: (p) => {
        //   return [p[0], '0%'];
        // },
      },
      xAxis: {
        type: 'time',
      },
      yAxis: {},
      series: {
        type: 'candlestick',
        data: keyList.map(k => {
          const color = gD[k][0] < gD[k][1] ? '#FF0000' 
            : (gD[k][0] > gD[k][1] ? '#0000FF' : '#888888');
          return {
            itemStyle: {
              color: color,
              borderColor: color,
            },
            value: [k + ":00:00Z", gD[k][0], gD[k][1], gD[k][2], gD[k][3]]
          }
          }),
      },
      grid: {
        
      },
      backgroundColor: '#00000000'
    };

    setTimeout(() => {
      if (!chart) chart = echarts.init(chartElement, 'dark');
      chart?.setOption(option);
    }, 0);
  }

  async function transaction(type: 'buy' | 'sell') {
    // console.log(type);
    await fetch('http://mc-stock.kro.kr:8081/api/stock', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uid: $user?.uid,
        stockID: $stock?.id,
        amount: amount,
        type: type
      })
    })
    .then(async r => {
      const res = await r.json();
      if (r.status != 200) {
        console.log(res);
        return;
      }
      var stocks = $userData?.stocks;

      if (!stocks) return;

      const index = stocks?.findIndex(s => s.id == $stock?.id);

      if (!$stock?.id) return;

      // console.log('ra', res.amount);

      currentAmount = res.amount;
      
      if (index == -1) {
        stocks?.push({
          id: $stock?.id,
          amount: res.amount
        })
      }
      else {
        stocks = stocks?.map(s => {
          if (s.id != $stock?.id) return s;
          return {
            id: s.id,
            amount: res.amount
          }
        })
      }

      console.log(stocks);

      userData.set({
        balance: res.balance,
        stocks: stocks
      });

      console.log($userData);

      amount = 1;

      // reloadToggle = false;

      // setTimeout(() => reloadToggle = true, 10);

      console.log('res', res);
    });
  }

  onMount(() => {
    makeChart($stock);
  })
</script>

<div class="popup" transition:fade={{ duration: 100, delay: 0 }}>
  <div class="popup-content">
    <h2>{$stock?.name}</h2>
    <p>{$stock?.description}</p>
    <div bind:this={chartElement} style="height: 300px; width: 600px"/>

    <div style="margin-bottom: 10px;">
      <!-- <p style="color: white;">{$stock && $stock?.priceList[0].value}</p> -->
      <span style="color: white;">{isBuyActive ? '매수량' : '매도량'} : </span>
      <input type="number" class="amount" bind:value={amount} 
        on:input={(e) => {
          if (amount < 1 || isNaN(amount) || amount % 1 !== 0 || !amount) 
            amount = 1 
        }}>
    </div>
    <div style="margin-bottom: 10px;">
      <span style="color: white;">자산 변화량 : </span>
      <span class="total-price">{$userData?.balance} ≫ {
        $stock && $userData?.balance 
          && Math.round(($userData?.balance + 
          (Math.round(amount * $stock?.priceList[0].value * 100) / 100) * (isBuyActive ? -1 : 1)) * 100) / 100}</span>
    </div>
    <div>
      <span style="color: white;">주식 보유량 변화량 : </span>
      <!-- <span style="color: white;">{$userData && $stock && ($userData.stocks.find(s => s.id == $stock?.id)?.amount ?? 0)} ≫ {
        $userData && $stock && (($userData.stocks.find(s => s.id == $stock?.id)?.amount ?? 0) 
          + (isBuyActive ? 1 : -1) * amount)
        }</span> -->
      <span style="color: white;">{currentAmount} ≫ {
        currentAmount + (isBuyActive ? 1 : -1) * amount
        }</span>
    </div>

    <div class="popup-buttons">
      <button class="switch-background" on:click={() => toggleSwitch()}>
        <button class="switch-toggle" 
        class:buy={isBuyActive}
        class:sell={!isBuyActive}
        >{isBuyActive ? '매수' : '매도'}</button>
      </button>
      <!-- <button class="buy-button" on:click={async () => await transaction('buy')}>매수</button>
      <button class="sell-button" on:click={async () => await transaction('sell')}>매도</button> -->
      <button class="trans-button" on:click={async () => await transaction(isBuyActive ? 'buy' : 'sell')}>거래</button>
      <button class="close-button" on:click={closePopup}>닫기</button>
    </div>
    
  </div>
</div>

<style>
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .popup-content {
    background: #ffffff10;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    text-align: center;
    backdrop-filter: blur(20px);

    & > h2 {
      color: var(--text);
    }

    & > p {
      color: var(--text);
    }
  }

  .popup-content *{
    color: var(--inverted);
  }

  .amount {
    border: none;
    border-bottom: 2px solid #333;
    background: transparent;
    padding: 5px 0;
    /* width: 100%; */
    font-size: 16px;
    width: 100px;
    color: white;
  }

  .amount:focus {
    outline: none;
  }

  .total-price {
    color: white;
  }

  .popup-buttons {
    margin-top: 20px;
  }

  .trans-button {
    background-color: var(--secondary);
    color: var(--text);
    padding: 10px 20px;
    height: 40px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 10px;
  }

  .close-button {
    background-color: var(--secondary);
    color: var(--text);
    padding: 10px 20px;
    height: 40px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
/* 
  .switch-container {
    display: flex;
    align-items: center;
  } */

  .switch-background {
    width: 120px;
    height: 40px;
    background-color: #333;
    border-radius: 5px;
    overflow: hidden;
    border: none;
    padding: 0;
    margin-right: 10px;

    & > .switch-toggle {
      width: 60px;
      height: 40px;
      border-radius: 5px;
      transition: transform 0.5s ease, background-color 0.5s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      border: none;
      /* padding: none; */
    }

    & > .switch-toggle.buy {
      background-color: #4CAF50;
      transform: translateX(0);
    }

    & > .switch-toggle.sell {
      background-color: #f44336;
      transform: translateX(100%);
    }
  }

  
/* 
  .buy-button, .sell-button {
    background-color: transparent;
    color: var(--text);
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    margin: 5px;
  } */
</style>
