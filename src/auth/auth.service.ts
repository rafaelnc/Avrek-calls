import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Hardcoded credentials as per requirements
  private readonly validCredentials = {
    username: 'admin',
    password: '123',
  };

  async validateUser(username: string, password: string): Promise<any> {
    if (
      username === this.validCredentials.username &&
      password === this.validCredentials.password
    ) {
      const { password, ...result } = this.validCredentials;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

