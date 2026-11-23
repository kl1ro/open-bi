import type TitleConfig from "@kl1ro/mip-bi-core/widgets/title";

export default function TitleWidget(props: TitleConfig) {
  return (
    <div className="h-full flex justify-center items-center text-center text-4xl font-bold bg-medium">
      <h2>{props.text}</h2>
    </div>
  );
}
