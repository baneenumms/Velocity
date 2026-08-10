package com.beni.repository;

import com.beni.entity.OtpCode;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OtpCodeRepository
        implements PanacheRepository<OtpCode> {

    public OtpCode findLatestActive(
            String email,
            String purpose
    ) {
        return find(
                "lower(recipientEmail) = ?1 and purpose = ?2 " +
                        "and status = 'ACTIVE' order by createdAt desc",
                email.toLowerCase(),
                purpose
        ).firstResult();
    }

    public long expireActive(
            String email,
            String purpose
    ) {
        return update(
                "status = 'EXPIRED' where lower(recipientEmail) = ?1 " +
                        "and purpose = ?2 and status = 'ACTIVE'",
                email.toLowerCase(),
                purpose
        );
    }

    public OtpCode findLatest(
            String email,
            String purpose
    ) {
        return find(
                "lower(recipientEmail) = ?1 and purpose = ?2 " +
                        "order by createdAt desc",
                email.toLowerCase(),
                purpose
        ).firstResult();
    }
}
