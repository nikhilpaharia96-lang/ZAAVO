// ═══════════════════════════════════════════════════════════
// ZAAVO — FoodCard Component
// src/components/FoodCard.jsx
// ═══════════════════════════════════════════════════════════

import { useDispatch, useSelector } from 'react-redux';
import { motion }   from 'framer-motion';
import { Plus, Heart, Star, Zap } from 'lucide-react';
import { addToCart, openFoodModal, toggleWishlist, selectIsWishlisted } from '../store';
import toast from 'react-hot-toast';

export default function FoodCard({ food, index = 0 }) {
  const dispatch    = useDispatch();
  const isWishlisted = useSelector(selectIsWishlisted(food._id));
  const { isLoggedIn } = useSelector(s => s.auth);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({
      food,
      quantity:       1,
      restaurantId:   food.restaurant?._id || food.restaurant,
      restaurantName: food.restaurant?.name || '',
    }));
    toast.success(`${food.name} added!`, { icon: '🛒' });
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error('Login to save items'); return; }
    dispatch(toggleWishlist(food));
    toast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist!',
      { icon: isWishlisted ? '💔' : '❤️' });
  };

  const dietColors = {
    veg:       'from-green-900/40 to-lime-900/40',
    'non-veg': 'from-orange-900/40 to-red-900/40',
    vegan:     'from-teal-900/40 to-emerald-900/40',
    eggetarian:'from-yellow-900/40 to-amber-900/40',
  };

  const discountPct = food.originalPrice && food.originalPrice > food.price
    ? Math.round((1 - food.price / food.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass border border-white/5 rounded-2xl overflow-hidden card-hover cursor-pointer group"
      onClick={() => dispatch(openFoodModal(food))}
    >
      {/* Image area */}
      <div className={`h-32 bg-gradient-to-br ${dietColors[food.dietType] || 'from-gray-900/40 to-slate-900/40'} flex items-center justify-center relative`}>
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {food.image || '🍽️'}
        </span>

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discountPct}%
          </div>
        )}

        {/* Wishlist */}
        <button onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 rounded-xl glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <Heart size={14} className={isWishlisted ? 'fill-red-400 text-red-400' : ''} />
        </button>

        {/* Popular tag */}
        {food.isPopular && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
            <Zap size={10} className="text-orange-400" />
            <span className="text-orange-300 text-xs font-semibold">Trending</span>
          </div>
        )}

        {/* Diet dot */}
        <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-dark ${food.dietType === 'veg' || food.dietType === 'vegan' ? 'bg-lime-400' : 'bg-orange-400'}`} />
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-display font-bold text-sm text-white leading-tight line-clamp-1">
          {food.name}
        </h4>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{food.restaurant?.name || food.restaurant}</p>

        {/* Nutrition preview */}
        {food.nutrition && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-gray-600 text-xs">🔥 {food.nutrition.calories}</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-600 text-xs">💪 {food.nutrition.protein}g</span>
          </div>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-white text-sm">₹{food.price}</span>
            {food.originalPrice > food.price && (
              <span className="text-gray-600 text-xs line-through ml-1">₹{food.originalPrice}</span>
            )}
          </div>
          <button onClick={handleAddToCart}
            className="btn-primary w-7 h-7 rounded-xl flex items-center justify-center shadow-md">
            <Plus size={15} />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={11} className="star-filled fill-yellow-400" />
          <span className="text-white text-xs font-semibold">{food.rating?.toFixed(1)}</span>
          {food.totalOrders > 0 && (
            <span className="text-gray-600 text-xs">· {food.totalOrders > 999 ? `${(food.totalOrders/1000).toFixed(1)}k` : food.totalOrders} orders</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════
// ZAAVO — RestaurantCard Component
// src/components/RestaurantCard.jsx  (save separately)
// ═══════════════════════════════════════════════════════════

// import { Link }        from 'react-router-dom';
// import { motion }      from 'framer-motion';
// import { Star, Clock, MapPin, Tag, ChevronRight } from 'lucide-react';
//
// const BG_GRADIENTS = [
//   'from-green-900/40 to-lime-900/40',
//   'from-orange-900/40 to-red-900/40',
//   'from-blue-900/40 to-purple-900/40',
//   'from-yellow-900/40 to-amber-900/40',
//   'from-teal-900/40 to-cyan-900/40',
//   'from-red-900/40 to-pink-900/40',
//   'from-purple-900/40 to-violet-900/40',
//   'from-stone-900/40 to-zinc-900/40',
// ];
//
// export default function RestaurantCard({ restaurant, index = 0 }) {
//   const bg = BG_GRADIENTS[index % BG_GRADIENTS.length];
//
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 16 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.06, duration: 0.4 }}
//     >
//       <Link to={`/restaurants/${restaurant._id}`}>
//         <div className="glass border border-white/5 rounded-2xl overflow-hidden card-hover group">
//           {/* Cover */}
//           <div className={`h-40 bg-gradient-to-br ${bg} flex items-center justify-center relative`}>
//             <span className="text-7xl transition-transform duration-500 group-hover:scale-110">
//               {restaurant.logo || '🍽️'}
//             </span>
//             {restaurant.badges?.map(badge => (
//               <span key={badge} className="absolute top-3 left-3 tag-lime text-xs px-2.5 py-1 rounded-full font-bold">{badge}</span>
//             ))}
//             {!restaurant.isOpen && (
//               <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//                 <span className="glass border border-white/10 text-gray-400 text-sm px-4 py-2 rounded-full font-semibold">
//                   Currently Closed
//                 </span>
//               </div>
//             )}
//           </div>
//
//           {/* Info */}
//           <div className="p-4">
//             <div className="flex items-start justify-between mb-2">
//               <div>
//                 <h3 className="font-display font-bold text-white text-base leading-tight">{restaurant.name}</h3>
//                 <p className="text-gray-400 text-xs mt-0.5">{restaurant.cuisine?.join(', ')}</p>
//               </div>
//               <div className="flex items-center gap-1 shrink-0 ml-2">
//                 <Star size={13} className="star-filled fill-yellow-400" />
//                 <span className="text-white text-sm font-bold">{restaurant.rating?.toFixed(1)}</span>
//               </div>
//             </div>
//
//             <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
//               <span className="flex items-center gap-1"><Clock size={11} />{restaurant.estimatedTime}</span>
//               <span className="text-gray-700">·</span>
//               <span className="flex items-center gap-1"><MapPin size={11} />{restaurant.deliveryRadius} km</span>
//               <span className="text-gray-700">·</span>
//               <span>{restaurant.deliveryFee === 0 ? '🆓 Free delivery' : `₹${restaurant.deliveryFee} del`}</span>
//             </div>
//
//             {restaurant.activeOffer && (
//               <div className="flex items-center gap-1.5 bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-2">
//                 <Tag size={11} className="text-orange-400 shrink-0" />
//                 <span className="text-orange-300 text-xs font-medium truncate">{restaurant.activeOffer}</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </Link>
//     </motion.div>
//   );
// }
