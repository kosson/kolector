function calcAverageRating(ratings) {

    let totalWeight = 0;
    let totalReviews = 0;
  
    ratings.forEach((rating) => {
  
      const weightMultipliedByNumber = rating.weight * rating.count;
      totalWeight += weightMultipliedByNumber;
      totalReviews += rating.count;
    });
  
    const averageRating = totalWeight / totalReviews;
  
    return averageRating.toFixed(2);
  }
  
  
  const ratings = [
    {
      weight: 5,
      count: 252
    },
    {
      weight: 4,
      count: 124
    },
    {
      weight: 3,
      count: 40
    },
    {
      weight: 2,
      count: 29
    },
    {
      weight: 1,
      count: 33
    }
  ];