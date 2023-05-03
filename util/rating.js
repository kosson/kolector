/**
 * Funcția calculează media aritmetică a unor valori dintr-un array ce reprezintă 
 * de câte ori s-a optat pentru un anumit nivel de apreciere din cinci. Valorile
 * ce contabilizează de câte ori s-a optat pentru un anumit nivel sunt în Array-ul
 * `ratings` ca prim argument. Cel de-al doilea argument este un array al valorii 
 * pentru fiecare nivel. Această valoare vine dintr-o setare fixă - din config.
 * @param {Array} ratings 
 * @param {Array} values valorile sunt fixe în default.json (config): `"values4levels": [33, 29, 40, 124, 252]`
 * @returns {Number}
 */
function calcAverageRating(ratings, values) {
    // Aici ajunge 2,10,38,5,2
    let totalVotesValue = 0;
    let totalVotes = 0;

    let i = undefined, ratingMultipliedByValue = undefined;
    for (i = 0; i < ratings.length; i++) {
      ratingMultipliedByValue = ratings[i] * values[i]; // Numarul aprecierilor pe un nivel X valoarea desemnată pe acel nivel
      totalVotesValue += ratingMultipliedByValue;
      totalVotes += ratings[i];
    };
  
    const averageRating = totalVotesValue / totalVotes; // valoarea calculată a tuturor aprecierilor / toți votanții
  
    return Math.round(averageRating.toFixed(2));
  };

  module.exports = calcAverageRating;