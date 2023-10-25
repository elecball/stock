<!-- main.svelte -->
<script lang="ts">
  import { auth, provider, user } from '$lib/auth';
  import { signInWithPopup, signOut } from 'firebase/auth';
  import StockPopup from '../components/StockPopup.svelte';

  // 주식 항목 타입 정의
  interface Stock {
    name: string;
    description: string;
    currentPrice: number;
    priceChange: number;
  }

  interface Balance {
    cash: number;
    portfolioValue: number;
  }

  let stockList: Stock[] = [
    {
      name: "애플 주식",
      description: "기술 회사",
      currentPrice: 150.25,
      priceChange: -2.50,
    },
    {
      name: "구글 주식",
      description: "검색 엔진 회사",
      currentPrice: 280.50,
      priceChange: 3.25,
    },
    {
      name: "마이크로소프트 주식",
      description: "소프트웨어 회사",
      currentPrice: 300.75,
      priceChange: 1.20,
    },
    // 추가 주식 항목
  ];

  let balance: Balance = {
    cash: 5000, // 현금 잔고
    portfolioValue: 0, // 포트폴리오 가치
  };

  let showPopup = false;
  let selectedStock: Stock | null = null;

  function openPopup(stock: Stock) {
    selectedStock = stock;
    showPopup = true;
  }

  async function login() {
    signInWithPopup(auth, provider)
      .then((cre) => {
        console.log(cre.user);
      });
  }


  async function logout() {
    await signOut(auth);
  }
</script>

<main>
  <h1>주식 시장</h1>
  {#if $user}
    <p>내 잔고: ${balance.cash.toFixed(2)}</p>
    <p>포트폴리오 가치: ${balance.portfolioValue.toFixed(2)}</p>
    <p>로그인된 사용자: {$user?.displayName}</p>
  {/if}
  <div class="stock-grid">
    {#each stockList as stock, i (stock.name)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="stock-item" on:click={() => openPopup(stock)}>
        <h2>{stock.name}</h2>
        <p>{stock.description}</p>
        <div class="stock-info">
          <div class="price">
            <p>현재 가격: ${stock.currentPrice.toFixed(2)}</p>
            <p>가격 변동: ${stock.priceChange.toFixed(2)}</p>
          </div>
        </div>
      </div>
      {#if (i + 1) % 3 === 0}
        <div class="clear"></div>
      {/if}
    {/each}
  </div>
  
  {#if $user}
    <button on:click={logout}>로그아웃</button>
  {:else}
    <button on:click={login}>로그인</button>
  {/if}
  
  <StockPopup bind:showPopup={showPopup} bind:stock={selectedStock} />
</main>

<style>
  main {
    text-align: center;
  }

  .stock-grid {
    display: grid; /* 그리드로 설정 */
    grid-template-columns: repeat(3, 1fr); /* 3개의 열로 나누기 */
    grid-gap: 10px; /* 셀 사이의 간격 설정 */
  }

  .stock-item {
    /* width: calc(33.33% - 20px); */
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
  }

  .clear {
    clear: both;
  }
</style>
