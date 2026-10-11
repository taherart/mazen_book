// The book's own icon family: Phosphor, which the printed book embeds in its Light weight.
// Every icon on the site comes through here, under the names the components already use.
//
// Weight: Light, as in the book, once an icon is drawn at 24px or more (size-6 and up). Smaller
// icons use Regular, because a Light stroke at 14–20px is under a pixel wide and breaks up on
// ordinary screens. Pass `weight` to override.
//
// The /ssr entry renders without React context, so these work in server and client components.
import type { Icon as Glyph, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowUUpLeftIcon,
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  CaretLeftIcon,
  ChartBarIcon,
  ChatCircleIcon,
  ChatTeardropTextIcon,
  ChatsIcon,
  CheckIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClipboardTextIcon,
  ClockIcon,
  CompassIcon,
  ConfettiIcon,
  DiceFiveIcon,
  DownloadSimpleIcon,
  EnvelopeIcon,
  EraserIcon,
  EyeIcon,
  EyeSlashIcon,
  FileArrowUpIcon,
  FileTextIcon,
  FileXIcon,
  FilmStripIcon,
  FlagIcon,
  FlaskIcon,
  FootprintsIcon,
  GaugeIcon,
  GiftIcon,
  HandHeartIcon,
  HouseIcon,
  ImageSquareIcon,
  ImagesIcon,
  LightbulbIcon,
  LinkSimpleIcon,
  ListIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MapPinIcon,
  MedalIcon,
  MedalMilitaryIcon,
  MegaphoneIcon,
  MoneyIcon,
  MoonIcon,
  MountainsIcon,
  PaperPlaneTiltIcon,
  PencilLineIcon,
  PencilSimpleIcon,
  PlayIcon,
  PlayCircleIcon,
  PlugIcon,
  PlusIcon,
  QrCodeIcon,
  RocketIcon,
  RowsIcon,
  ScalesIcon,
  ScrollIcon,
  SealCheckIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  ShieldWarningIcon,
  ShoppingBagIcon,
  SignInIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SmileyIcon,
  SparkleIcon,
  SquaresFourIcon,
  SunIcon,
  ThumbsUpIcon,
  TicketIcon,
  TrashIcon,
  TrayIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  WarningIcon,
  WifiHighIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";

const LARGE = /(?:^|\s)size-(?:[6-9]|[1-9]\d)(?:\s|$)/;

function icon(Glyph: Glyph, name: string) {
  function Icon({ weight, className, ...props }: IconProps) {
    const w: IconWeight = weight ?? (className && LARGE.test(className) ? "light" : "regular");
    return <Glyph weight={w} className={className} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

export type Icon = ReturnType<typeof icon>;

export const AlertTriangle = icon(WarningIcon, "AlertTriangle");
export const ArrowLeft = icon(ArrowLeftIcon, "ArrowLeft");
export const Award = icon(MedalMilitaryIcon, "Award");
export const BadgeCheck = icon(SealCheckIcon, "BadgeCheck");
export const Banknote = icon(MoneyIcon, "Banknote");
export const BarChart3 = icon(ChartBarIcon, "BarChart3");
export const Bell = icon(BellIcon, "Bell");
export const BookOpen = icon(BookOpenIcon, "BookOpen");
export const CalendarClock = icon(CalendarDotsIcon, "CalendarClock");
export const CalendarDays = icon(CalendarIcon, "CalendarDays");
export const Check = icon(CheckIcon, "Check");
export const ChevronDown = icon(CaretDownIcon, "ChevronDown");
export const ChevronLeft = icon(CaretLeftIcon, "ChevronLeft");
export const CircleCheckBig = icon(CheckCircleIcon, "CircleCheckBig");
export const ClipboardCheck = icon(ClipboardTextIcon, "ClipboardCheck");
export const Clock3 = icon(ClockIcon, "Clock3");
export const Compass = icon(CompassIcon, "Compass");
export const Dices = icon(DiceFiveIcon, "Dices");
export const Download = icon(DownloadSimpleIcon, "Download");
export const Eraser = icon(EraserIcon, "Eraser");
export const ExternalLink = icon(ArrowSquareOutIcon, "ExternalLink");
export const Eye = icon(EyeIcon, "Eye");
export const EyeOff = icon(EyeSlashIcon, "EyeOff");
export const FileCheck2 = icon(FileTextIcon, "FileCheck2");
export const FileUp = icon(FileArrowUpIcon, "FileUp");
export const FileWarning = icon(FileXIcon, "FileWarning");
export const Film = icon(FilmStripIcon, "Film");
export const Flag = icon(FlagIcon, "Flag");
export const FlaskConical = icon(FlaskIcon, "FlaskConical");
export const Footprints = icon(FootprintsIcon, "Footprints");
export const Gauge = icon(GaugeIcon, "Gauge");
export const Gift = icon(GiftIcon, "Gift");
export const HandHeart = icon(HandHeartIcon, "HandHeart");
export const Home = icon(HouseIcon, "Home");
export const ImagePlus = icon(ImageSquareIcon, "ImagePlus");
export const Images = icon(ImagesIcon, "Images");
export const Inbox = icon(TrayIcon, "Inbox");
export const Laugh = icon(SmileyIcon, "Laugh");
export const LayoutGrid = icon(SquaresFourIcon, "LayoutGrid");
export const LayoutList = icon(RowsIcon, "LayoutList");
export const Lightbulb = icon(LightbulbIcon, "Lightbulb");
export const Link2 = icon(LinkSimpleIcon, "Link2");
export const List = icon(ListIcon, "List");
export const LoaderCircle = icon(CircleNotchIcon, "LoaderCircle");
export const Lock = icon(LockIcon, "Lock");
export const LogIn = icon(SignInIcon, "LogIn");
export const LogOut = icon(SignOutIcon, "LogOut");
export const Mail = icon(EnvelopeIcon, "Mail");
export const MapPin = icon(MapPinIcon, "MapPin");
export const Medal = icon(MedalIcon, "Medal");
export const Megaphone = icon(MegaphoneIcon, "Megaphone");
export const Menu = icon(ListIcon, "Menu");
export const MessageCircle = icon(ChatCircleIcon, "MessageCircle");
export const MessageSquareHeart = icon(ChatTeardropTextIcon, "MessageSquareHeart");
export const MessagesSquare = icon(ChatsIcon, "MessagesSquare");
export const Moon = icon(MoonIcon, "Moon");
export const Mountain = icon(MountainsIcon, "Mountain");
export const PartyPopper = icon(ConfettiIcon, "PartyPopper");
export const PenLine = icon(PencilLineIcon, "PenLine");
export const Pencil = icon(PencilSimpleIcon, "Pencil");
export const Play = icon(PlayIcon, "Play");
export const PlayCircle = icon(PlayCircleIcon, "PlayCircle");
export const PlugZap = icon(PlugIcon, "PlugZap");
export const Plus = icon(PlusIcon, "Plus");
export const QrCode = icon(QrCodeIcon, "QrCode");
export const Rocket = icon(RocketIcon, "Rocket");
export const RotateCcw = icon(ArrowCounterClockwiseIcon, "RotateCcw");
export const Scale = icon(ScalesIcon, "Scale");
export const ScrollText = icon(ScrollIcon, "ScrollText");
export const Search = icon(MagnifyingGlassIcon, "Search");
export const SearchX = icon(MagnifyingGlassMinusIcon, "SearchX");
export const Send = icon(PaperPlaneTiltIcon, "Send");
export const Share2 = icon(ShareNetworkIcon, "Share2");
export const ShieldAlert = icon(ShieldWarningIcon, "ShieldAlert");
export const ShieldCheck = icon(ShieldCheckIcon, "ShieldCheck");
export const ShoppingBag = icon(ShoppingBagIcon, "ShoppingBag");
export const SlidersHorizontal = icon(SlidersHorizontalIcon, "SlidersHorizontal");
export const Sparkles = icon(SparkleIcon, "Sparkles");
export const Sun = icon(SunIcon, "Sun");
export const ThumbsUp = icon(ThumbsUpIcon, "ThumbsUp");
export const Ticket = icon(TicketIcon, "Ticket");
export const Trash2 = icon(TrashIcon, "Trash2");
export const TriangleAlert = icon(WarningIcon, "TriangleAlert");
export const Trophy = icon(TrophyIcon, "Trophy");
export const Undo2 = icon(ArrowUUpLeftIcon, "Undo2");
export const UserRound = icon(UserIcon, "UserRound");
export const Users = icon(UsersIcon, "Users");
export const Wallet = icon(WalletIcon, "Wallet");
export const Wifi = icon(WifiHighIcon, "Wifi");
export const X = icon(XIcon, "X");
