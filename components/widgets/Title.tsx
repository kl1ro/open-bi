export default function Title(props: TitleProps) {
  return (
    <div className="h-full flex justify-center items-center text-4xl font-bold bg-medium">
      <h1>{props.text}</h1>
    </div>
  );
}

export interface TitleProps {
  text: string;
}
