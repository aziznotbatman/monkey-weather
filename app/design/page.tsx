import { Monkey } from "@/components/monkey/Monkey";

export default function DesignPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 16 }}>
      <Monkey uid="a" outfit={{}} mood="happy" />
      <Monkey
        uid="b"
        outfit={{
          top: "tshirt",
          bottom: "shorts",
          footwear: "sneakers",
          eyes: "sunglasses",
          head: "cap",
        }}
        mood="sweaty"
        sky="clear"
      />
      <Monkey
        uid="c"
        outfit={{
          top: "sweater",
          outer: "puffer",
          bottom: "trousers",
          footwear: "boots",
          head: "beanie",
          neck: "scarf",
          hands: "gloves",
        }}
        mood="shivering"
        sky="snow"
      />
      <Monkey
        uid="d"
        outfit={{
          top: "longsleeve",
          outer: "raincoat",
          bottom: "trousers",
          footwear: "rainboots",
          carry: "umbrella",
        }}
        mood="soggy"
        sky="rain"
      />
      <Monkey
        uid="e"
        outfit={{ top: "hoodie", outer: "lightjacket", bottom: "trousers", footwear: "sneakers" }}
        mood="windblown"
        sky="partly"
        windy
      />
      <Monkey uid="f" outfit={{}} mood="thinking" pose="wave" />
    </main>
  );
}
