<script lang="ts">
  import { getStocks } from "$lib/auth";
  import StockPopup from "$lib/components/StockPopup.svelte";
  import type { Stock } from "$lib/interfaces";
  import { onMount } from "svelte";

  let stockList: Stock[] = [];
  
  let showPopup = false;
  let selectedStock: Stock | null = null;

  function openPopup(stock: Stock) {
    selectedStock = stock;
    showPopup = true;
  }

  onMount(async () => {
    const websocket = new WebSocket('wss://stock.elecball.workers.dev');
    websocket.addEventListener('message', event => {
      console.log(`socket message: ${event.data}`);
    });

    websocket.onopen = () => {
      websocket.send('MESSAGE');
    }
    
    stockList = (await getStocks()).filter(s => s.priceList);
    
    console.log(stockList);
  });
</script>

<main>
  <div class="stock-tile">
    {#each stockList as stock, i (stock.name)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="stock-item" on:click={() => openPopup(stock)}>
        <div>
          <span class="stock-name">{stock.name}</span>
          <span class="stock-desc">{stock.description}</span>
        </div>
        <div>
          <div class="stock-price-wrapper">
            <span class="stock-price">{(stock.priceList[0].value).toFixed(2)} USD</span>
          </div>
          <div class="stock-price-change-wrapper">
            {#if stock.priceList[0].value > stock.priceList[1].value}
              <span class="price up">+{(stock.priceList[0].value / stock.priceList[1].value).toFixed(2)}</span>
            {:else if stock.priceList[0].value < stock.priceList[1].value}
              <span class="price down">{(stock.priceList[0].value / stock.priceList[1].value).toFixed(2)}</span>
            {:else}
              <span class="price">{(stock.priceList[0].value / stock.priceList[1].value).toFixed(2)}</span>
            {/if}
          </div>
        </div>
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
      justify-content: space-between;
      background-color: var(--transparent05);
    }

    & > .stock-item > div:nth-child(1) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    & > .stock-item > div:nth-child(2) {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    & .stock-price-wrapper{
      width: 125px;
      text-align: right;
    }

    & .stock-price-change-wrapper{
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
