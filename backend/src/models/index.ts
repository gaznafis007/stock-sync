import { Drop } from './Drop.js';
import { Purchase } from './Purchase.js';
import { Reservation } from './Reservation.js';
import { User } from './User.js';

Drop.hasMany(Reservation, { foreignKey: 'dropId', as: 'reservations' });
Reservation.belongsTo(Drop, { foreignKey: 'dropId', as: 'drop' });

User.hasMany(Reservation, { foreignKey: 'userId', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Drop.hasMany(Purchase, { foreignKey: 'dropId', as: 'purchases' });
Purchase.belongsTo(Drop, { foreignKey: 'dropId', as: 'drop' });

User.hasMany(Purchase, { foreignKey: 'userId', as: 'purchases' });
Purchase.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { Drop, Purchase, Reservation, User };
