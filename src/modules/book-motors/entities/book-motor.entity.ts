import Hashids from 'hashids';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { BookingAddOn } from 'src/modules/add-ons/entities/booking-add-on.entity';
import { BookMotorItem } from './book-motor-item.entity';
import { Tourist } from 'src/modules/tourists/entities/tourist.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Sale } from 'src/modules/sales/entities/sale.entity';

export enum StatusBookMotor {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('book_motors')
export class BookMotor {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(
        Date.now(),
        Math.floor(Math.random() * 10000),
      );
    }
  }

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: StatusBookMotor,
    default: StatusBookMotor.PENDING,
  })
  status: StatusBookMotor;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total_price: number;

  @OneToMany(() => BookingAddOn, (bookingAddOn) => bookingAddOn.book_motor)
  booking_add_ons: BookingAddOn[];

  @OneToMany(() => BookMotorItem, (bookMotorItem) => bookMotorItem.book_motor)
  book_motor_items: BookMotorItem[];

  @OneToMany(() => Tourist, (tourist) => tourist.book_motor)
  tourists: Tourist[];

  @OneToMany(() => Payment, (payment) => payment.bookMotor)
  payments: Payment[];

  @OneToMany(() => Sale, (sale) => sale.bookMotor)
  sales: Sale[];

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;
}
