import avatar1 from "../_assets/images/wallet-avatars/avatar-1.png";
import avatar2 from "../_assets/images/wallet-avatars/avatar-2.png";
import avatar3 from "../_assets/images/wallet-avatars/avatar-3.png";
import avatar4 from "../_assets/images/wallet-avatars/avatar-4.png";
import avatar5 from "../_assets/images/wallet-avatars/avatar-5.png";
import avatar6 from "../_assets/images/wallet-avatars/avatar-6.png";

export function getRandomAvatar(address: string) {
	const index = address?.length ? address.charCodeAt(address.length - 1) % 6 : 0;
	switch (index) {
		case 5: {
			return avatar6;
		}
		case 4: {
			return avatar5;
		}
		case 3: {
			return avatar4;
		}
		case 2: {
			return avatar3;
		}
		case 1: {
			return avatar2;
		}
		default: {
			return avatar1;
		}
	}
}
