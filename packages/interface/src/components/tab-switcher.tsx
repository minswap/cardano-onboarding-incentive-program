import * as React from "react";
import { cn } from "@/lib/utils";

type TabProps = {
	values: readonly { label: string; value: string }[];
	value: string;
	onValueChange: (value: string) => void;
};

export function TabSwitcher({ values, value, onValueChange }: TabProps) {
	const ref = React.useRef<HTMLDivElement>(null);
	const [overlay, setOverlay] = React.useState<{
		width: number;
		x: number;
	}>(() => ({ width: 64, x: 0 }));
	const selected = values.find((v) => v.value === value);
	const selectedIndex = values.findIndex((v) => v.value === value);

	React.useEffect(() => {
		if (!ref.current) {
			return;
		}

		const selectedNode = ref.current.querySelector(`#item-${selectedIndex}`) as HTMLButtonElement;
		setOverlay({
			x: selectedNode.offsetLeft,
			width: selectedNode.clientWidth,
		});
	}, [selectedIndex]);

	function handleItemClick(value: string) {
		onValueChange(value);
	}

	return (
		<div
			className="relative rounded-full bg-sf-pri-df p-1 text-label-sm-sec text-itr-tent-pri-sub inline-flex md:w-fit w-full"
			ref={ref}
		>
			{values.map((item, index) => (
				<TabItem
					index={index}
					isSelected={selected?.value === item.value}
					key={item.value}
					onClick={handleItemClick}
					value={item}
				/>
			))}

			<div
				className="absolute top-1 bottom-1 left-0 rounded-full bg-base-bg transition-all duration-200 hover:cursor-pointer"
				style={{
					transform: `translateX(${overlay.x}px)`,
					width: overlay.width,
				}}
			/>
		</div>
	);
}

type TabItemProps = {
	value: { value: string; label: string };
	onClick: (value: string) => void;
	index: number;
	isSelected: boolean;
};

export function TabItem({ value, index, onClick, isSelected }: TabItemProps) {
	function handleClick() {
		onClick(value.value);
	}

	return (
		<button
			className={cn(
				"relative z-10 lg:px-6 px-3 py-1 text-center hover:cursor-pointer flex-auto",
				isSelected ? "text-itr-tent-sec-df" : "",
			)}
			id={`item-${index}`}
			onClick={handleClick}
			type="button"
		>
			{value.label}
		</button>
	);
}
