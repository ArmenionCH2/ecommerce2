import Input from "./components/input";
import Button from "./components/button";

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <form action="" className="flex gap-2">

        <Input type="text" name="search" placeholder="Search..."></Input>
        <Button type="submit" text="Search"></Button>
      </form>
    </div>
  );
}
