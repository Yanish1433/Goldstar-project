import { CategoryGrid, ColourBrowse, Deals, Shelves, Ticker } from './Storefront.jsx';
import G10Feature from './G10Feature.jsx';
import MadeInNepal from './MadeInNepal.jsx';

// Everything under the landing hero, in one lazy chunk.
export default function LandingBelow() {
  return (
    <>
      <Ticker />
      <CategoryGrid />
      <Shelves />
      <Deals />
      <G10Feature />
      <ColourBrowse />
      <MadeInNepal />
    </>
  );
}
