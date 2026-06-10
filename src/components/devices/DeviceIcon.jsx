import Emoji from "../ui/Emoji";
import { iconeAparelhoSeguro } from "../../utils/formatters";

export default function DeviceIcon({ device, className = "" }) {
  return <Emoji className={className}>{iconeAparelhoSeguro(device)}</Emoji>;
}
