/**
 * Format minutes played into a readable time string (hours and minutes)
 * @param {number} minutes - Number of minutes played
 * @returns {string} Formatted time string
 */
export const formatTimePlayed = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0 min';
    
    if (minutes < 60) {
      return `${Math.floor(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.floor(minutes % 60);
      
      if (remainingMinutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${remainingMinutes} min`;
      }
    }
  };
  
  /**
   * Format date to a readable string
   * @param {Date|string} date - Date object or date string
   * @returns {string} Formatted date string
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };
  
  /**
   * Format number with commas for thousands
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  export const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    return num.toLocaleString();
  };