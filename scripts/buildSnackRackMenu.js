import fs from 'fs';

const menuRaw = {
  restaurant: "Snack Rack",
  currency: "INR",
  phone: ["7983475688", "8126626488"],
  address: "Thakurpur Road, Premnagar, Dehradun",
  instagram: "@snack.rack.doon",
  free_home_delivery: true,
  minimum_order_value: 250,
  categories: [
    {
      name: "Soups",
      items: [
        { name: "Lung Fung Soup", price: { veg: 80, non_veg: 100 } },
        { name: "Clear Soup", price: { veg: 80, non_veg: 100 } },
        { name: "Sweet Corn Soup", price: { veg: 80, non_veg: 100 } },
        { name: "Hot 'N' Sour Soup", price: { veg: 80, non_veg: 100 } },
        { name: "Manchow Soup", price: { veg: 80, non_veg: 100 } },
        { name: "Mushroom Soup", price: { veg: 80, non_veg: 100 } }
      ]
    },
    {
      name: "Shakes & Beverages",
      items: [
        { name: "Vanilla Shake", price: 90 },
        { name: "Mango Shake", price: 100 },
        { name: "Chocolate Shake", price: 100 },
        { name: "Strawberry Shake", price: 100 },
        { name: "Black Current Shake", price: 120 },
        { name: "Oreo Shake", price: 120 },
        { name: "KitKat Shake", price: 140 },
        { name: "Cold Coffee", price: 120 },
        { name: "Hot Coffee", price: 60 },
        { name: "Mojito", price: 120 },
        { name: "Masala Chai", price: 50 }
      ]
    },
    {
      name: "Noodles",
      items: [
        { name: "Veg Noodles", price: { half: 80, full: 140 } },
        { name: "Chilli Garlic Noodles", price: { half: 100, full: 160 } },
        { name: "Paneer Noodles", price: { half: 100, full: 160 } },
        { name: "Egg Noodles", price: { half: 100, full: 160 } },
        { name: "Chicken Noodles", price: { half: 120, full: 180 } },
        { name: "Singapuri Noodles", price: { veg: 150, chicken: 180 } },
        { name: "Hakka Noodles", price: { veg: 150, chicken: 180 } }
      ]
    },
    {
      name: "Fried Rice",
      items: [
        { name: "Veg Fried Rice", price: { half: 100, full: 180 } },
        { name: "Egg Fried Rice", price: { half: 140, full: 200 } },
        { name: "Chicken Fried Rice", price: { half: 140, full: 200 } }
      ]
    },
    {
      name: "Veg Momos",
      items: [
        { name: "Steam Veg Momos", price: { "4_pcs": 60, "8_pcs": 100 } },
        { name: "Fried Veg Momos", price: { "4_pcs": 80, "8_pcs": 100 } },
        { name: "Cocktail Veg Momos", price: { "4_pcs": 80, "8_pcs": 140 } },
        { name: "Kurkure Veg Momos", price: { "4_pcs": 80, "8_pcs": 140 } },
        { name: "Gravy Veg Momos", price: { "4_pcs": 80, "8_pcs": 140 } },
        { name: "Tandoori Veg Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Afghani Veg Momos", price: { "4_pcs": 80, "8_pcs": 150 } }
      ]
    },
    {
      name: "Chicken Momos",
      items: [
        { name: "Steam Chicken Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Fried Chicken Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Cocktail Chicken Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Kurkure Chicken Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Gravy Chicken Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Tandoori Chicken Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Afghani Chicken Momos", price: { "4_pcs": 90, "8_pcs": 160 } }
      ]
    },
    {
      name: "Cheese Momos",
      items: [
        { name: "Steam Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Fried Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Cocktail Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Kurkure Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Gravy Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Tandoori Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Afghani Cheese Momos", price: { "4_pcs": 80, "8_pcs": 150 } }
      ]
    },
    {
      name: "Mutton Momos",
      items: [
        { name: "Steam Mutton Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Fried Mutton Momos", price: { "4_pcs": 80, "8_pcs": 150 } },
        { name: "Cocktail Mutton Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Kurkure Mutton Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Gravy Mutton Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Tandoori Mutton Momos", price: { "4_pcs": 90, "8_pcs": 160 } },
        { name: "Afghani Mutton Momos", price: { "4_pcs": 90, "8_pcs": 160 } }
      ]
    },
    {
      name: "Rolls",
      items: [
        { name: "Spring Roll", price: 80 },
        { name: "Gravy Roll", price: 120 },
        { name: "Paneer Tikka Roll", price: 120 },
        { name: "Chicken Tikka Roll", price: 100 },
        { name: "Chaap Roll", price: { regular: 80, large: 100 } }
      ]
    },
    {
      name: "Pasta",
      items: [
        { name: "White Sauce Pasta", price: 220 },
        { name: "Red Sauce Pasta", price: 220 },
        { name: "Chicken White Sauce Pasta", price: 250 }
      ]
    },
    {
      name: "Burger & Fries",
      items: [
        { name: "Veg Burger", price: 90 },
        { name: "Chicken Burger", price: 100 },
        { name: "Chicken Cheese Burger", price: 120 },
        { name: "Regular Fries", price: 100 },
        { name: "Peri-Peri Fries", price: 120 }
      ]
    },
    {
      name: "Sandwich",
      items: [
        { name: "Veg Sandwich", price: 120 },
        { name: "Veg Cheese Sandwich", price: 150 },
        { name: "Paneer Sandwich", price: 150 },
        { name: "Chicken Sandwich", price: 150 },
        { name: "Chicken Cheese Sandwich", price: 160 }
      ]
    },
    {
      name: "Chinese",
      items: [
        { name: "Veg Manchurian", price: { half: 140, full: 250 } },
        { name: "Chilli Potato", price: { half: 120, full: 250 } },
        { name: "Honey Chilli Potato", price: { half: 120, full: 220 } },
        { name: "Chilli Paneer", price: { half: 180, full: 300 } },
        { name: "Chilli Mushroom", price: { half: 150, full: 250 } },
        { name: "Crispy Corn", price: { half: 180, full: 300 } },
        { name: "Chilli Chicken", price: { half: 180, full: 300, large: 400 } },
        { name: "Garlic Chicken", price: { half: 180, full: 250, large: 400 } },
        { name: "Chicken Manchurian", price: { half: 200, full: 250, large: 400 } },
        { name: "Fried Chicken", price: { half: 200, full: 300, large: 350 } },
        { name: "Chicken Lollipop", price: { "4_pcs": 200, "8_pcs": 350 } },
        { name: "Chicken Popcorn", price: { half: 160, full: 300 } }
      ]
    },
    {
      name: "Indian Main Course - Veg",
      items: [
        { name: "Dal Tadka", price: { half: 140, full: 220 } },
        { name: "Dal Fry", price: { half: 140, full: 220 } },
        { name: "Dal Makhani", price: { half: 150, full: 250 } },
        { name: "Mix Veg", price: { half: 160, full: 280 } },
        { name: "Mutter Paneer", price: { half: 180, full: 320 } },
        { name: "Shahi Paneer", price: { half: 190, full: 340 } },
        { name: "Kadhai Paneer", price: { half: 180, full: 320 } },
        { name: "Palak Paneer", price: { half: 180, full: 320 } },
        { name: "Paneer Lababdar", price: { half: 190, full: 340 } },
        { name: "Handi Paneer", price: { half: 180, full: 320 } },
        { name: "Paneer Butter Masala", price: { half: 190, full: 340 } },
        { name: "Paneer Tikka Masala", price: { half: 180, full: 320 } },
        { name: "Paneer Do Pyaza", price: { half: 180, full: 320 } },
        { name: "Malai Kofta", price: { half: 180, full: 320 } },
        { name: "Palak Kofta", price: { half: 180, full: 320 } },
        { name: "Mushroom Masala", price: { half: 180, full: 320 } },
        { name: "Malai Mushroom", price: { half: 180, full: 320 } },
        { name: "Kadhai Mushroom", price: { half: 180, full: 320 } },
        { name: "Tawa Mushroom", price: { half: 180, full: 320 } },
        { name: "Butter Gravy Chaap", price: { half: 180, full: 320 } },
        { name: "Shahi Gravy Chaap", price: { half: 180, full: 320 } },
        { name: "Tawa Chaap", price: { half: 180, full: 320 } }
      ]
    },
    {
      name: "Indian Main Course - Non-Veg",
      items: [
        { name: "Butter Chicken", price: { half: 180, "2_pc": 320, full: 560 } },
        { name: "Kadhai Chicken", price: { half: 180, "2_pc": 320, full: 560 } },
        { name: "Chicken Curry", price: { half: 180, full: 280, large: 500 } },
        { name: "Chicken Lababdar", price: { half: 180, full: 320, large: 540 } },
        { name: "Chicken Kali Mirch", price: { half: 320, full: 540 } },
        { name: "Chicken Do Pyaza", price: { half: 320, full: 540 } },
        { name: "Chicken Tikka Masala", price: { half: 300, full: 500 } },
        { name: "Chicken Rara", price: { half: 340, full: 560 } },
        { name: "Tawa Chicken", price: { half: 320, full: 540 } },
        { name: "Handi Chicken", price: { half: 340, full: 560 } },
        { name: "Chicken Korma", price: { half: 320, full: 540 } },
        { name: "Mutton Curry", price: { half: 260, full: 500 } },
        { name: "Mutton Masala", price: { half: 260, full: 500 } },
        { name: "Mutton Rogan Josh", price: { half: 280, full: 520 } },
        { name: "Mutton Rara", price: { half: 280, full: 520 } },
        { name: "Mutton Korma", price: { half: 260, full: 500 } },
        { name: "Egg Curry", price: { "2_egg": 180 } }
      ]
    },
    {
      name: "Tandoori Special - Non-Veg",
      items: [
        { name: "Chicken Tikka", price: { "4_pcs": 200, "8_pcs": 340 } },
        { name: "Chicken Banjara Tikka", price: { "4_pcs": 200, "8_pcs": 340 } },
        { name: "Chicken Haryali Tikka", price: { "4_pcs": 200, "8_pcs": 340 } },
        { name: "Chicken Darbari Tikka", price: { "4_pcs": 220, "8_pcs": 360 } },
        { name: "Chicken Malai Tikka", price: { "4_pcs": 220, "8_pcs": 360 } },
        { name: "Fish Tikka", price: { "4_pcs": 250, "8_pcs": 360 } },
        { name: "Chicken Seekh Kebab", price: { "4_pcs": 200, "8_pcs": 300 } },
        { name: "Mutton Seekh Kebab", price: { "4_pcs": 300, "8_pcs": 450 } },
        { name: "Tandoori Leg", price: { half: 150, full: 250 } },
        { name: "Stuffed Leg", price: { half: 180, full: 280 } },
        { name: "Tandoori Chicken", price: { half: 250, full: 400 } },
        { name: "Afghani Chicken", price: { half: 280, full: 440 } }
      ]
    },
    {
      name: "Tandoori Special - Veg",
      items: [
        { name: "Mushroom Tikka", price: { half: 180, full: 300 } },
        { name: "Stuffed Mushroom", price: { half: 180, full: 200 } },
        { name: "Paneer Tikka", price: { half: 180, full: 320 } },
        { name: "Paneer Malai Tikka", price: { half: 200, full: 340 } },
        { name: "Paneer Hariyali Tikka", price: { half: 180, full: 320 } },
        { name: "Paneer Banjara", price: { half: 200, full: 340 } }
      ]
    },
    {
      name: "Roti",
      items: [
        { name: "Tandoori Roti", price: 12 },
        { name: "Butter Roti", price: 18 },
        { name: "Plain Naan", price: 30 },
        { name: "Butter Naan", price: 40 },
        { name: "Garlic Naan", price: 45 },
        { name: "Missi Roti", price: 30 },
        { name: "Lachha Paratha", price: 35 },
        { name: "Aloo Paratha", price: 80 },
        { name: "Paneer Paratha", price: 100 },
        { name: "Stuffed Naan", price: 60 },
        { name: "Rumali Roti", price: 20 },
        { name: "Garlic Roti", price: 25 }
      ]
    },
    {
      name: "Biryani",
      items: [
        { name: "Plain Rice", price: { half: 60, full: 100 } },
        { name: "Jeera Rice", price: { half: 80, full: 120 } },
        { name: "Veg Biryani", price: { half: 120, full: 200 } },
        { name: "Chicken Biryani", price: { half: 180, full: 300 } },
        { name: "Mutton Biryani", price: { half: 200, full: 350 } }
      ]
    },
    {
      name: "Salad & Raita",
      items: [
        { name: "Green Salad", price: 80 },
        { name: "Mix Raita", price: 100 },
        { name: "Cucumber Raita", price: 120 },
        { name: "Boondi Raita", price: 100 },
        { name: "Gym Diet - Veg", price: 140 },
        { name: "Gym Diet - Non-Veg", price: 160 }
      ]
    },
    {
      name: "Chaap",
      items: [
        { name: "Masala Chaap", price: { half: 100, full: 180 } },
        { name: "Malai Chaap", price: { half: 120, full: 200 } },
        { name: "Hariyali Chaap", price: { half: 100, full: 180 } },
        { name: "Afghani Chaap", price: { half: 120, full: 200 } },
        { name: "Kurkure Chaap", price: { half: 100, full: 180 } },
        { name: "Chilli Chaap", price: { half: 80, full: 140 } }
      ]
    },
    {
      name: "Desserts",
      items: [
        { name: "Ice Cream", price: 40 },
        { name: "Gulab Jamun", price: 60 },
        { name: "Gajar Halwa", price: 80 },
        { name: "Ras Malai", price: 80 }
      ]
    }
  ]
};

// Curated high quality food image mapping per category / item keywords
function getValidFoodImage(itemName, catName) {
  const n = itemName.toLowerCase();
  const c = catName.toLowerCase();

  if (c.includes('soup')) {
    if (n.includes('corn')) return "https://images.unsplash.com/photo-1616501268209-edfa27448831?w=500&auto=format&fit=crop&q=80";
    if (n.includes('mushroom')) return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80";
    if (n.includes('manchow') || n.includes('hot')) return "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('shake') || c.includes('beverage')) {
    if (n.includes('mango')) return "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&auto=format&fit=crop&q=80";
    if (n.includes('chocolate') || n.includes('kitkat') || n.includes('oreo')) return "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80";
    if (n.includes('strawberry')) return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80";
    if (n.includes('cold coffee')) return "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80";
    if (n.includes('hot coffee')) return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
    if (n.includes('mojito')) return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80";
    if (n.includes('chai') || n.includes('tea')) return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('noodle')) {
    if (n.includes('chicken')) return "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80";
    if (n.includes('hakka') || n.includes('singapuri')) return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('rice') || c.includes('biryani')) {
    if (n.includes('chicken')) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80";
    if (n.includes('mutton')) return "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80";
    if (n.includes('fried rice')) return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('momo')) {
    if (n.includes('fried')) return "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80";
    if (n.includes('tandoori') || n.includes('afghani') || n.includes('kurkure')) return "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80";
    if (n.includes('gravy') || n.includes('cocktail')) return "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('roll')) {
    if (n.includes('spring')) return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('pasta')) {
    if (n.includes('red')) return "https://images.unsplash.com/photo-1621996346565-e3d5d6281729?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('burger') || c.includes('fries')) {
    if (n.includes('fries')) return "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('sandwich')) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('chinese')) {
    if (n.includes('potato')) return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80";
    if (n.includes('paneer') || n.includes('mushroom') || n.includes('corn')) return "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80";
    if (n.includes('chicken') || n.includes('lollipop') || n.includes('popcorn')) return "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('main course')) {
    if (c.includes('non-veg') || n.includes('chicken') || n.includes('mutton') || n.includes('egg')) {
      if (n.includes('butter chicken')) return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80";
      if (n.includes('mutton')) return "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80";
      return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80";
    }
    if (n.includes('dal')) return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80";
    if (n.includes('chaap')) return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('tandoori')) {
    if (n.includes('chicken') || n.includes('leg') || n.includes('seekh') || n.includes('fish')) {
      if (n.includes('tandoori chicken')) return "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80";
      if (n.includes('seekh')) return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80";
      return "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('roti') || c.includes('naan')) {
    if (n.includes('naan')) return "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('chaap')) {
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('salad') || c.includes('raita')) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80";
  }

  if (c.includes('dessert')) {
    if (n.includes('ice cream')) return "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
}

function normalizeVariantLabel(key) {
  if (key === 'half') return 'Half';
  if (key === 'full') return 'Full';
  if (key === '4_pcs') return '4 Pcs';
  if (key === '8_pcs') return '8 Pcs';
  if (key === '2_pc') return '2 Pcs';
  if (key === '2_egg') return '2 Eggs';
  if (key === 'veg') return 'Veg';
  if (key === 'non_veg') return 'Non-Veg';
  if (key === 'chicken') return 'Chicken';
  if (key === 'regular') return 'Regular';
  if (key === 'large') return 'Large';
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

const dishes = [];
let dishIndex = 1;

menuRaw.categories.forEach((cat, cIdx) => {
  cat.items.forEach((item) => {
    const isCatNonVeg = cat.name.toLowerCase().includes('non-veg') || cat.name.toLowerCase().includes('chicken') || cat.name.toLowerCase().includes('mutton');
    const isItemNonVeg = item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('mutton') || item.name.toLowerCase().includes('egg') || item.name.toLowerCase().includes('fish');
    const isVeg = !(isCatNonVeg || isItemNonVeg);

    let basePrice = 0;
    const variants = [];

    if (typeof item.price === 'number') {
      basePrice = item.price;
      variants.push({ name: 'Regular', price: item.price });
    } else if (typeof item.price === 'object') {
      const keys = Object.keys(item.price);
      keys.forEach((k) => {
        variants.push({
          name: normalizeVariantLabel(k),
          price: Number(item.price[k])
        });
      });
      basePrice = Math.min(...variants.map(v => v.price));
    }

    const id = `sr-${cIdx + 1}-${dishIndex++}`;
    const img = getValidFoodImage(item.name, cat.name);

    dishes.push({
      id,
      _id: id,
      name: item.name,
      category: cat.name,
      price: basePrice,
      basePrice,
      originalPrice: Math.round(basePrice * 1.2),
      isVeg,
      inStock: true,
      variants,
      sizes: variants,
      variantsCount: variants.length,
      image: img,
      images: [img],
      desc: item.notes || `Fresh & authentic ${item.name} prepared with finest ingredients at Snack Rack.`
    });
  });
});

console.log(`Successfully generated ${dishes.length} dishes across ${menuRaw.categories.length} categories.`);

const fileContent = `// SNACK RACK – OFFICIAL MENU WITH PRICES, VARIANTS & IMAGES
// Restaurant: Snack Rack | Dehradun
// Phone: 7983475688 / 8126626488
// Address: Thakurpur Road, Premnagar, Dehradun

export const SNACK_RACK_STORE_INFO = {
  name: "Snack Rack",
  tagline: "Indian | Chinese | Tandoori | Momos | Shakes",
  deliveryNote: "Free Home Delivery on orders above ₹250",
  address: "Thakurpur Road, Premnagar, Dehradun",
  phone: "7983475688",
  altPhone: "8126626488",
  instagram: "@snack.rack.doon",
  foodypayId: "FP-9896",
  rating: 5.0
};

export const INITIAL_OFFLINE_TABLES = [
  { id: "tb_1", name: "Table 1", section: "Restaurant", capacity: 4, status: "available" },
  { id: "tb_2", name: "Table 2", section: "Restaurant", capacity: 4, status: "available" },
  { id: "tb_3", name: "Table 3", section: "Restaurant", capacity: 4, status: "available" },
  { id: "tb_4", name: "Table 4", section: "Cafe", capacity: 2, status: "available" },
  { id: "tb_5", name: "Table 5", section: "Cafe", capacity: 2, status: "available" },
  { id: "tb_6", name: "Family 1", section: "Family Hall", capacity: 6, status: "available" },
  { id: "tb_7", name: "Family 2", section: "Family Hall", capacity: 8, status: "available" }
];

export const SNACK_RACK_FULL_MENU = ${JSON.stringify(dishes, null, 2)};
`;

fs.writeFileSync('src/data/snackRackMenuData.js', fileContent, 'utf-8');
console.log('src/data/snackRackMenuData.js written successfully!');
