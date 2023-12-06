<script lang="ts">
  import { auth, provider, user, isLoading, waitLoading, firestore, userData } from "$lib/auth";
  import type { UserData } from "$lib/interfaces";
  import { signInWithPopup, signOut } from "firebase/auth";
  import { collection, doc, getDoc, setDoc } from "firebase/firestore";
  import { onMount } from "svelte";

  async function login() {
    signInWithPopup(auth, provider).then(async (cre) => {
      const user = cre.user;
      const docSnap = await getDoc(doc(firestore, "users", cre.user.uid));

      console.log(user.uid);

      if (!docSnap.exists()) {
        await fetch('http://localhost:8081/api/user/create', {
          // mode: 'no-cors',
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid: user.uid
          })
        }).then(async res => console.log(await res.json(), 'z'))
          .catch(async e => console.log(e, 'a'));
        // balance = 10000;
      }
      else {
        // balance = docSnap.get("balance");
      }
      console.log(cre.user);
    });
  }

  async function logout() {
    await signOut(auth);
  }

  onMount(async () => {
    await waitLoading();
    // if ($user) {
    //   const docSnap = await getDoc(doc(firestore, "users", $user?.uid));
    //   balance = docSnap.get("balance");
    // }

    if ($user) {
      const docSnap = await getDoc(doc(firestore, "users", $user.uid));
      userData.set(docSnap.data() as UserData | null);
    }
    else {
      userData.set(null);
    }
      
    console.log($user);
  })
</script>

<nav>
  <div>
    <span class="logo">주식 시장</span>
    <div class="profile">
      {#if $isLoading}
        <span>로딩 중</span>
      {:else if $user}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <img src="{$user?.photoURL}" alt="profile" on:click={logout}>
        <div class="info">
          <span>{$user?.displayName}</span>
          <span>${$userData?.balance.toFixed(2)}</span>
        </div>
      {:else}
        <button on:click={login}>로그인</button>
      {/if}
      <!-- 임시로 프로필 클릭 시 로그아웃 -->
      <!-- 추후에 마이페이지에 있는 로그아웃 버튼 이용 -->
    </div>
  </div>
</nav>

<link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>

<slot />

<style>
  nav {
    height: 48px;
    padding: 0.5rem 7%;
    border-bottom: 1px solid var(--transparent10);
  }

  nav > div {
    display: flex;
    height: 100%;
    justify-content: space-between;
    align-items: center;
  }

  span {
    font-size: 1.5rem;
  }

  .logo {
    font-weight: 700;
  }

  .profile{
    height: 100%;
    border-radius: 5px;
    padding: 5px;
    box-sizing: border-box;
    border: 1px solid var(--transparent30);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .profile > span{
    font-size: 1rem;
  }

  button{
    background: transparent;
    color: var(--text);
    outline: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }

  .info{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .info > span:nth-child(1){
    font-size: 16px;
  }

  .info > span:nth-child(2){
    font-size: 14px;
    color: var(--desc);
  }

  img{
    height: 100%;
    border-radius: 100px;
  }
</style>
