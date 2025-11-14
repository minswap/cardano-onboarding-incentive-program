import { RiCloseLine } from "@remixicon/react";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	title: React.ReactNode;
	children: React.ReactNode;
	className?: string;
};

export function Dialog({ open, onClose, className, children, title }: Props) {
	const dialogRef = React.useRef<HTMLDialogElement>(null);

	const showModal = React.useCallback(() => {
		dialogRef.current?.show();
		if (!dialogRef.current?.open) {
			dialogRef.current?.show();
		}
	}, []);

	const closeModal = React.useCallback(() => {
		if (dialogRef.current?.open) {
			dialogRef.current?.close();
		}
	}, []);

	function handleClose() {
		onClose();
	}

	React.useEffect(() => {
		if (open) {
			showModal();
		} else {
			closeModal();
		}
	}, [closeModal, open, showModal]);

	function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
		if (event.target === dialogRef.current) {
			closeModal();
		}
	}

	return (
		<>
			{open && (
				<div
					className="fixed inset-0 z-40 bg-ovl-md transition-opacity animate-in fade-in"
					onClick={handleClose}
				/>
			)}

			<dialog
				className={cn(
					"fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full md:max-w-md",
					"overflow-hidden rounded-2xl bg-base-bg p-4 shadow-2xl",
					"transition-all transition-discrete duration-200 animate-out fade-out slide-out-to-bottom",
					"open:animate-in open:slide-in-from-bottom",
					"starting:open:animate-out starting:open:slide-out-to-bottom",
					className,
				)}
				onClick={handleClick}
				onClose={handleClose}
				ref={dialogRef}
			>
				<div
					className="flex flex-col gap-y-2"
					data-name="content"
				>
					<div className="flex items-center justify-between space-x-4">
						<div className="text-title-h6 text-itr-tent-pri-df">{title}</div>
						<div
							className="size-8 shrink-0 flex items-center justify-center rounded-full cursor-pointer hover:bg-sf-pri-hv active:bg-sf-pri-pressed"
							onClick={onClose}
						>
							<RiCloseLine className="size-6 shrink-0 text-itr-tent-pri-df" />
						</div>
					</div>

					{children}
				</div>
			</dialog>
		</>
	);
}
