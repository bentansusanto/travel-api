import Hashids from 'hashids';
import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import { User } from 'src/modules/users/entities/user.entity';
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

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCES = 'success',
  FAILED = 'failed',
}

@Entity('payments')
export class Payment {
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

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BookTour, (bookTour) => bookTour.payments)
  @JoinColumn({ name: 'book_tour_id' })
  bookTour: BookTour;

  @Column({
    nullable: true,
  })
  total_tourists: number;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  payer_email: string;

  @Column({ nullable: true })
  redirect_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;
}
