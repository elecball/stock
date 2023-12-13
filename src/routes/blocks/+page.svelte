<script lang="ts">
  import { onMount } from 'svelte';
  import { getDocs, collection } from 'firebase/firestore';
  import { firestore, userData } from '$lib/auth';
  import type { Block } from '$lib/interfaces';
  import { slide } from 'svelte/transition';
  import { writable } from 'svelte/store';

  const datasStore = writable<({
    type: 'buy' | 'sell',
    user: string,
    objectId: string,
    amount: number,
    price: number
  } | string)[]>([]);

  onMount(async () => {
    const blockCol = collection(firestore, 'blocks');
    const querySnapshot = await getDocs(blockCol);
    const datas = querySnapshot.docs.map(doc => (doc.data() as Block))
      .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime())
      .reverse()
      .map(d => d.data);

    datasStore.set(datas);

    const websocket = new WebSocket('ws://mc-stock.kro.kr:8082');
    websocket.addEventListener('message', event => {
      const msg = (event.data as string);
      const parsedMsg = JSON.parse(msg);

      datasStore.update(oldDatas => [parsedMsg, ...oldDatas]);
    });
  });
</script>

<ul>
  {#each $datasStore as data}
    <li transition:slide={{ duration: 200, delay: 0, axis: 'y'}}>
      {#if typeof(data) == "string"}
        <p>{data}</p>
      {:else}
        <p>개수 : {data.amount}</p>
        <p>대상 ID : {data.objectId}</p>
        <p>가격 : {data.price}</p>
        <p>유형 : {data.type}</p>
        <p>유저 ID : {data.user}</p>
      {/if}
    </li>
  {/each}
</ul>


<style>
  ul {
    /* padding: 20px 150px;   */
    list-style-type: none;
    padding: 0;
  }

  li {
    border: 1px solid #ddd;
    /* margin-bottom: 8px; */
    margin: 8px 100px;
    padding: 12px;
    border-radius: 4px;
  }
</style>
