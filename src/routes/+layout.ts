import { auth, user, waitLoading } from '$lib/auth';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ }) => {
  // console.log(await waitLoading());
  // console.log(auth.currentUser);
  // const user = await getUser();
  // console.log(user?.email);
	return {
	};
};