import Hashids from 'hashids';
import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { ServiceType } from '../../payments/entities/service-type.enum';
import { BookMotor } from '../../book-motors/entities/book-motor.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SaleStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum Currency {
  USD = 'USD',
  IDR = 'IDR',
}

@Entity('sales')
export class Sale {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(Date.now());
    }
  }

  @ManyToOne(() => BookTour)
  @JoinColumn({ name: 'book_tour_id' })
  bookTour: BookTour;

  @ManyToOne(() => BookMotor, (bookMotor) => bookMotor.sales)
  @JoinColumn({ name: 'book_motor_id' })
  bookMotor: BookMotor;

  @OneToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'amount',
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.IDR,
    name: 'currency',
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.TOUR,
    name: 'service_type',
  })
  service_type: ServiceType;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
    name: 'status',
  })
  status: SaleStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
    name: 'deleted_at',
  })
  deleted_at: Date;
}
