import Hashids from 'hashids';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AddOn } from './add-on.entity';
import { BookMotor } from '../../book-motors/entities/book-motor.entity';
import { BookTour } from '../../book-tours/entities/book-tour.entity';

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity('booking_add_ons')
export class BookingAddOn {
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

  @ManyToOne(() => BookMotor, (bookMotor) => bookMotor.booking_add_ons, { nullable: true })
  @JoinColumn({ name: 'book_motor_id' })
  book_motor: BookMotor;

  @ManyToOne(() => BookTour, (bookTour) => bookTour.add_ons, { nullable: true })
  @JoinColumn({ name: 'book_tour_id' })
  book_tour: BookTour;

  @ManyToOne(() => AddOn)
  @JoinColumn({ name: 'add_on_id' })
  add_on: AddOn;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  price_at_booking: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;
}
