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
import { Motor } from './motor.entity';

export enum PriceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('motor_prices')
export class MotorPrice {
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

  @ManyToOne(() => Motor, (motor) => motor.motor_prices)
  @JoinColumn({ name: 'motor_id' })
  motor: Motor;

  @Column({
    type: 'enum',
    enum: PriceType,
  })
  price_type: PriceType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;
}
